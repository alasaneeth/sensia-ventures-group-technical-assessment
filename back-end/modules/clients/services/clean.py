import pandas as pd
from difflib import SequenceMatcher
from itertools import combinations
from tqdm import tqdm
from django.core.management.base import BaseCommand
from django.db import transaction
from customer.models import Customer
import gc
import time
import os

# Union-Find for clustering
class UnionFind:
    def __init__(self):
        self.parent = {}

    def find(self, x):
        if self.parent.setdefault(x, x) != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx != ry:
            self.parent[ry] = rx


def similarity(a: str, b: str) -> float:
    """Fast similarity calculation with early termination and case-insensitive comparison"""
    if not a or not b:
        return 0.0
    
    # Convert to uppercase for case-insensitive comparison
    a_upper = a.upper() if isinstance(a, str) else ''
    b_upper = b.upper() if isinstance(b, str) else ''
    
    if a_upper == b_upper:
        return 1.0
    
    # Quick length check for early termination
    len_ratio = min(len(a_upper), len(b_upper)) / max(len(a_upper), len(b_upper)) if max(len(a_upper), len(b_upper)) > 0 else 0
    if len_ratio < 0.5:  # If length difference is too large, skip expensive calculation
        return 0.0
    
    return SequenceMatcher(None, a_upper, b_upper).ratio()

class Command(BaseCommand):
    help = "Cluster customers by fuzzy name/address match and export results"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            help="If set, only process this many Customer records"
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=1000,
            help="Batch size for database operations (default: 1000)"
        )
        parser.add_argument(
            "--max-block-size",
            type=int,
            default=500,
            help="Maximum block size to process (default: 500)"
        )
        parser.add_argument(
            "--checkpoint-interval",
            type=int,
            default=10000,
            help="Save progress every N records (default: 10000)"
        )

    def process_block_efficiently(self, block_records, threshold, uf):
        """Process a block with optimizations for large blocks"""
        matches = []
        n = len(block_records)
        
        # For very large blocks, use a sampling approach instead of skipping
        if n > self.max_block_size:
            self.stdout.write(f"Processing large block with {n} records using sampling")
            # Sample records to keep processing manageable
            import random
            # Take a random sample of max_block_size records or 20% of the block, whichever is larger
            sample_size = max(self.max_block_size, int(n * 0.2))
            block_records = random.sample(block_records, min(sample_size, n))
            n = len(block_records)
            
        # For small blocks, use the original approach
        if n <= 50:
            for a, b in combinations(block_records, 2):
                ns = similarity(a['individual_name'], b['individual_name'])
                if ns < 0.5:  # Early termination for name similarity
                    continue
                as_ = similarity(a['primary_address'], b['primary_address'])
                combined = 0.6 * ns + 0.4 * as_
                if combined >= threshold:
                    matches.append({
                        'id_1': a['id'], 'id_2': b['id'],
                        'name_score': round(ns, 2),
                        'addr_score': round(as_, 2),
                        'combined_score': round(combined, 2),
                    })
                    uf.union(a['id'], b['id'])
        else:
            # For larger blocks, use a more efficient approach
            # Sort by name for better early termination
            sorted_records = sorted(block_records, key=lambda x: x['individual_name'])
            
            for i in range(n):
                for j in range(i + 1, min(i + 20, n)):  # Limit comparisons per record
                    a, b = sorted_records[i], sorted_records[j]
                    ns = similarity(a['individual_name'], b['individual_name'])
                    if ns < 0.5:  # Early termination
                        break  # Since sorted, subsequent records will be even less similar
                    as_ = similarity(a['primary_address'], b['primary_address'])
                    combined = 0.6 * ns + 0.4 * as_
                    if combined >= threshold:
                        matches.append({
                            'id_1': a['id'], 'id_2': b['id'],
                            'name_score': round(ns, 2),
                            'addr_score': round(as_, 2),
                            'combined_score': round(combined, 2),
                        })
                        uf.union(a['id'], b['id'])
        
        return matches

    def bulk_update_person_ids(self, updates_dict, batch_size):
        """Efficiently update person_ids in batches from dictionary"""
        if not updates_dict:
            return
            
        self.stdout.write(f"Updating {len(updates_dict)} records in database...")
        
        # Convert dict to list of Customer objects
        updates = [Customer(id=customer_id, person_id=person_id) 
                  for customer_id, person_id in updates_dict.items()]
        
        # Process in batches
        total_batches = (len(updates) + batch_size - 1) // batch_size
        
        with transaction.atomic():
            for i in tqdm(range(0, len(updates), batch_size), 
                         total=total_batches, desc="Updating DB"):
                batch = updates[i:i + batch_size]
                Customer.objects.bulk_update(batch, ['person_id'], batch_size=batch_size)
    
    def handle(self, *args, **options):
        start_time = time.time()
        
        # Get options
        limit = options.get('limit')
        batch_size = options.get('batch_size', 1000)
        self.max_block_size = options.get('max_block_size', 500)
        checkpoint_interval = options.get('checkpoint_interval', 1000)
        
        # Initialize streaming files
        matches_file = 'customer_matches_streaming.csv'
        if os.path.exists(matches_file):
            os.remove(matches_file)  # Start fresh
        
        # 1. Pull cleaned data in chunks to manage memory
        self.stdout.write("Loading customer data...")
        qs = Customer.objects.values(
            'id', 'individual_name', 'primary_address', 'zip_code'
        ).order_by('id')
        
        if limit:
            qs = qs[:limit]
            
        df = pd.DataFrame.from_records(qs).fillna('')
        
        # Convert addresses and names to uppercase to avoid case sensitivity issues
        df['primary_address'] = df['primary_address'].str.upper()
        df['individual_name'] = df['individual_name'].str.upper()
        self.stdout.write(f"Loaded {len(df)} records")

        # 2. Create blocking key with better distribution
        # Use first 2 chars of last name, but handle edge cases better
        def get_last_name_prefix(name):
            if not name or not isinstance(name, str):
                return 'XX'
            parts = name.split()
            if not parts:
                return 'XX'
            last = parts[-1].upper()[:2]
            # Ensure we have 2 characters even for short names
            return last.ljust(2, 'X')
        
        # Apply the function to create block keys
        df['block_key'] = df.apply(
            lambda row: get_last_name_prefix(row['individual_name']) + '|' + 
                      (row['zip_code'][:5] if row['zip_code'] else '00000'),
            axis=1
        )

        # 3. Score & cluster with streaming updates
        THRESHOLD = 0.85
        uf = UnionFind()
        total_matches = 0
        pending_updates = {}  # Track person_id updates to batch
        
        # Initialize all records in UnionFind with their own ID as person_id
        # This ensures every record gets a person_id even if no matches are found
        for customer_id in df['id']:
            uf.find(customer_id)  # This initializes the record in UnionFind
        
        # Group by block and process
        blocks = df.groupby('block_key')
        total_blocks = blocks.ngroups
        
        self.stdout.write(f"Processing {total_blocks} blocks...")
        
        processed_records = 0
        blocks_processed = 0
        
        for block_key, block in tqdm(blocks, total=total_blocks, desc="Clustering blocks"):
            recs = block.to_dict('records')
            matches = self.process_block_efficiently(recs, THRESHOLD, uf)
            
            
            processed_records += len(recs)
            blocks_processed += 1
            
            # Collect person_id updates for this block
            for rec in recs:
                current_person_id = uf.find(rec['id'])
                if current_person_id != rec['id']:  # Only update if person_id changed
                    pending_updates[rec['id']] = current_person_id
            
            # Periodic database updates and cleanup
            if (blocks_processed % 1000 == 0 or 
                len(pending_updates) >= batch_size * 5 or
                processed_records % checkpoint_interval == 0):
                
                # Update database with pending changes
                if pending_updates:
                    self.bulk_update_person_ids(pending_updates, batch_size)
                    pending_updates.clear()
                
                # Cleanup and progress report
                gc.collect()
                self.stdout.write(f"Processed {processed_records} records, found {total_matches} matches")

        # 4. Ensure all records have a person_id assigned
        self.stdout.write("Ensuring all records have a person_id assigned...")
        final_updates = {}
        for customer_id in df['id']:
            # Get the person_id from UnionFind
            person_id = uf.find(customer_id)
            # Add to updates if not already in pending_updates
            if customer_id not in pending_updates:
                final_updates[customer_id] = person_id
        
        # Update any remaining records
        if final_updates:
            self.stdout.write(f"Updating {len(final_updates)} additional records with person_id...")
            self.bulk_update_person_ids(final_updates, batch_size)
            
        # 5. Calculate final statistics from Union-Find structure
        self.stdout.write("Calculating final statistics...")
        unique_persons = set()
        for customer_id in df['id']:
            unique_persons.add(uf.find(customer_id))
        unique_count = len(unique_persons)

        # 6. Create summary Excel if matches file exists and is reasonable size
        if os.path.exists(matches_file):
            file_size = os.path.getsize(matches_file)
            if file_size < 100 * 1024 * 1024:  # Less than 100MB
                try:
                    matches_df = pd.read_csv(matches_file)
                    out = 'customer_duplicates_summary.xlsx'
                    self.stdout.write(f"Creating Excel summary with {len(matches_df)} matches...")
                    with pd.ExcelWriter(out, engine='openpyxl') as writer:
                        matches_df.to_excel(writer, sheet_name='matched_pairs', index=False)
                    self.stdout.write(f"Excel summary saved to {out}")
                except Exception as e:
                    self.stdout.write(f"Could not create Excel summary: {e}")
            else:
                self.stdout.write(f"Matches file too large ({file_size/1024/1024:.1f}MB), skipping Excel export")

        # Final check for any records still missing person_id
        self.stdout.write("Performing final check for any records still missing person_id...")
        missing_count = Customer.objects.filter(person_id=None).count()
        
        if missing_count > 0:
            self.stdout.write(f"Found {missing_count} records still missing person_id. Fixing them...")
            
            # Direct SQL update for maximum efficiency and to avoid any ORM issues
            self.stdout.write("Using direct SQL update to ensure all records get fixed...")
            from django.db import connection
            
            with connection.cursor() as cursor:
                # Update all records without person_id to use their own ID
                cursor.execute(
                    "UPDATE arc_customers SET person_id = id WHERE person_id IS NULL"
                )
                self.stdout.write(f"Direct SQL update affected {cursor.rowcount} rows")
            
            # Verify all records now have person_id
            final_missing = Customer.objects.filter(person_id=None).count()
            if final_missing > 0:
                self.stdout.write(self.style.WARNING(f"There are still {final_missing} records without person_id"))
            else:
                self.stdout.write(self.style.SUCCESS("All records now have person_id assigned!"))
        else:
            self.stdout.write(self.style.SUCCESS("All records already have person_id assigned!"))
        
        # Final statistics
        total_time = time.time() - start_time
        
        self.stdout.write(self.style.SUCCESS(
            f"Done! {unique_count} unique persons identified from {len(df)} records "
            f"in {total_time:.1f} seconds ({total_matches} matches found)"
        ))
        self.stdout.write(f"Matches saved to: {matches_file}")
