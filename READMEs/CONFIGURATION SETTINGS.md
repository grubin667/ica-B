## Configuration Files & Settings
The configuartion and settings for the ICA site and associated processes, databases, etc. is held in a surprisingly large number of files.
These files have very specific names and locations. This doc describes them all.

The information in these files is split between that which can be stored in source control (GitHub) and that containing passwords, etc. ("secrets")
that cannot be stored in GitHub and are enumerated in the project's .gitignore file. The fact that certain files should not be kept in GitHub
means that propogation of the information in these secret files must be performed separately from normal deployment techniques. This doc
will serve as a design for handling secret information and a roadmap to follow when updating of secret info is needed.

This doc contains both ICA-specific and general (e.g., Next.js) information about what files can hold which params and settings and where they should go
for both production and dev.

### Types of configuration files
#### .env files
#### breejob/.cmdrc.json
breejob is a separate process that runs a bree-based cron job under Express. As such, it doesn't share use of the main .env files. Both dev and prod
settings are kept in .cmdrc.json.
#### ~/.aws
These are config files for API read/write access to S3.
- config
- credentials
- custom-policy.json
- ini.txt
#### ecosystem.config.cjs
pm2
#### .gitignore file
TK
#### ./.vscode/launch.json
TK





### General .env file handling in Next.js (with just a little info that's specific to ICA)
When Next.js encounters a process.env.XXX, it searches for XXX in all .env files in the project's top-level directory in the following order. It stops searching when it finds the first occurrence of the variable it's looking for.

|                                |  include secrets      |            include defaults    |      add to .gitignore       |      save to github repo     |       notes                     |
| ------------------------------ | --------------------- | ------------------------------ | ---------------------------- | ---------------------------- | ------------------------------- |
| 1 process.env (start)          |                       |                                |                              |                              |                                 |
| 2 .env.$(NODE_ENV).local       |        X              |                                |             X                |                              |      good for secrets specific to dev or prod     |
| 3 .env.local                   |        X              |                                |             X                |                              |      good for secrets covering both dev and prod  |
| 4 .env.$(NODE_ENV)             |                       |                   X            |                              |                X             |      use for defaults specific to dev or prod     |
| 5 .env (end)                   |                       |                   X            |                              |                X             |      use for defaults covering both dev and prod  |

Example: If you define a variable in .env.development.local (row 2) and then redefine it in env.development (row 4), the value set in env.development.local will prevail, since it came first.

### Environment files holding secrets--i.e., values we don't want viewable in our Github repo
Secrets should go into one of the environment files ending ".local". The .gitignore entry ".env*.local" prevents these files from being added to the GitHub repo.

### Default (non-secret) environment variables
Default environment variables are those that are used for non-secret environment variables. We want their files to be stored to GitHub. They do not end with ".local".

### Other rules when using Nextjs
In general, the .env.local (row 3) file will be sufficient for secrets. However, sometimes you might need to specify some secrets that are specific to the dev or the prod environments. If so, use .env.development.local and .env.production.local (row 2). (In ICA there is nothing in the .env.$(NODE_ENV).local files.)

Set defaults in .env (if they are for all environments), in .env.development (for the dev environment) or .env.production (for the prod environment).

The .env*.local files always override the defaults files, since they come earlier in the search.

### Source control reminders
The .env, .env.development, and .env.production files (the ones without .local) will be added to your repository as they define defaults and are not in .gitignore.

.env*.local should be added to .gitignore, as those files are intended not to be added to source control since they hold secrets.

## .env file handling with dotenv in non-Next projects (ICA specific)
\breejob holds a separate node/express app. As such, it handles its .env separation and securing tasks differently. It uses the npm package *dotenv* for this.
