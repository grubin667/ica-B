
## Development and production
This page explains how to use Prisma Migrate commands in development and production environments.

### Development environments
In a development environment, use the ```migrate dev``` command to generate and apply migrations:

```
npx prisma migrate dev
```
#### Create and apply migrations
${\color{red}DANGER}$
```migrate dev``` is a development command and should never be used in a production environment.

This command:

1. Reruns the existing migration history in the <u>shadow database</u> in order to detect schema drift (edited or deleted migration file or a manual change to the database schema)
2. Applies pending migrations to the shadow database (for example, new migrations created by colleagues)
3. If it detects changes to the Prisma schema, it generates a new migration from these changes
4. Applies all unapplied migrations to the development database and updates the ```_prisma_migrations``` table
5. Triggers the generation of artifacts (for example, Prisma Client)

The ```migrate dev``` command will prompt you to reset the database in the following scenarios:

* Migration history conflicts caused by <u>modified or missing migrations</u>
* The database schema has drifted away from the end-state of the migration history

#### Reset the development database
You can also ```reset``` the database yourself to undo manual changes or ```db push``` experiments by running:
```
npx prisma migrate reset
```
${\color{red}WARNING}$
```migrate reset``` is a development command and should never be used in a production environment.

This command:

1. Drops the database/schema¹ if possible, or performs a soft reset if the environment does not allow deleting databases/schemas¹
2. Creates a new database/schema¹ with the same name if the database/schema¹ was dropped
3. Applies all migrations
4. Runs seed scripts

¹ For MySQL and MongoDB this refers to the database, for PostgreSQL and SQL Server to the schema, and for SQLite to the database file.

```
Note: For a simple and integrated way to re-create data in your development database as often as needed, check out our seeding guide.
```

#### Customizing migrations
Sometimes, you need to modify a migration <b>before applying it</b>. For example:

* You want to introduce a significant refactor, such as changing blog post tags from a String[] to a Tag[]
* You want to rename a field (by default, Prisma Migrate will drop the existing field)
* You want to change the direction of a 1-1 relationship
* You want to add features that cannot be represented in Prisma Schema Language - such as a partial index or a stored procedure.

The ```--create-only``` command allows you to create a migration without applying it:

```
npx prisma migrate dev --create-only
```

To apply the edited migration, run ```prisma migrate dev``` again.

Refer to <u>Customizing migrations</u> for examples.

#### Team development
See: <u>Team development with Prisma Migrate</u>.

### Production and testing environments
In production and testing environments (i.e., not development), use the ```migrate deploy``` command to apply migrations:

```
npx prisma migrate deploy
```

Note: ```migrate deploy``` should generally be part of an automated CI/CD pipeline, and we do not recommend running this command locally to deploy changes to a production database.

This command:

1. Compares applied migrations against the migration history and warns if any migrations have been modified:
```
WARNING The following migrations have been modified since they were applied: 20210313140442_favorite_colors
```
2. Applies pending migrations

The migrate deploy command:

* Does not issue a warning if an already applied migration is missing from migration history
* Does not detect drift (production database schema differs from migration history end state - for example, due to a hotfix)
* Does not reset the database or generate artifacts (such as Prisma Client)
* Does not rely on a shadow database

See also:

* Prisma Migrate in deployment
* Production troubleshooting

#### Advisory locking
Prisma Migrate makes use of advisory locking when you run production commands such as:

* prisma migrate deploy
* prisma migrate dev
* prisma migrate resolve

This safeguard ensures that multiple commands cannot run at the same time - for example, if you merge two pull requests in quick succession.

Advisory locking has a <b>10 second timeout</b> (not configurable), and uses the default advisory locking mechanism available in the underlying provider:

* PostgreSQL
* MySQL
* Microsoft SQL server

Prisma Migrate's implementation of advisory locking is purely to avoid catastrophic errors - if your command times out, you will need to run it again.

Since 5.3.0 the advisory locking can be disabled using the ```PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK``` environment variable





OLD STUFF

## Prisma reminders
### After creating prisma.schema, build the database for the first time:
~~~
npx prisma migrate dev --name init
~~~
This command did two things:
1. It created a new SQL migration file for this migration in the prisma/migrations directory.
2. It ran the SQL migration file against the database.

Because the SQLite database file didn't exist before, the command also created it inside the prisma directory with the name dev.db as defined in the schema file and via the environment variable in the .env file.
### If there have been no schema changes and you want to reset the db:
~~~
npm run prisma:reset
~~~
This ....
### If there have been schema changes and you want to rebuild everything:
~~~
npx prisma migrate dev
npm run prisma:reset
~~~
This will apply the changes in the schema to PrismaClient. It will create a new migration after asking for a name. It will rerun everything, including seeding data.
### Querying relations
By default, ***Prisma only returns scalar fields in the result objects of a query***. That's why, even though you also created a new Post record for the new User record, for example, the console only printed an object with three scalar fields: id, email and name.

In order to also retrieve the Post records that belong to a User, you can use the include option via the posts relation field:
~~~
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const usersWithPosts = await prisma.user.findMany({
    include: {
      posts: true,
    },
  })
  console.dir(usersWithPosts, { depth: null })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
~~~
### Notes
- You will have to enter a valid email address on first run.












