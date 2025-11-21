# Migrations

when change the database model designs make sure to reflect the changes on the migrations by creating a new migration file 

```
npx sequelize-cli migration:generate --name your_migration_file_name
```

now fill the `up` function and `down` function to update the models
the up function will run when you run migrate. For down will run when you run undo to the last migration

now after write your changes to the database run 

```
npx sequelize-cli db:migrate
```

this will run all the migrations that hasn't run yet. It keeps track of them by a special table called `SequelizeMeta`

in case you want undo the last migration run 
```
npx sequelize-cli db:migrate
```

## Note
- Sequelize will select the database depending on the `NODE_ENV` in your `.env` file so make sure to update that
- You can change every single piece of information in `.env` and refelct it in `config/config.js`