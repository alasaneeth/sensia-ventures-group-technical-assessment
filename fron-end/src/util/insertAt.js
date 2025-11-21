export default function insertAt(array, index, ...items) {
    array.splice(index, 0, ...items);
}