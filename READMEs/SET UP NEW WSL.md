### Setting up a new development machine (in WSL)
1. Enable systemctl by editing /etc/wsl.conf and adding new [boot] section containing systemd=true
2. Make ~/dev
3. Install 
    - nvm (source ~/.bashrc)
    - node (using nvm ls-remote)
    - pnpm (npm install -g pnpm@latest)
    - git (likely already installed)
4. Open VSCode in Windows and use remote explorer to connect to new Ubuntu machine in WSL.
4. Copy ~/.aws from another wsl machine. It contains these 4 files:
    1. config
        ~~~
        [default]
        region = us-east-1
        output = ini
        ~~~
    2. credentials
        ~~~
        [default]
        aws_access_key_id=AKIA3TNFM5GXKDMHGGOL
        aws_secret_access_key=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
        ~~~
    3. custom-policy.json
        ~~~
        {
            "Version": "2012-10-17",
            "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:GetObject*", "s3:ListBucket"],
                "Resource": [
                "arn:aws:s3:::$!BUCKET_NAME!$",
                "arn:aws:s3:::$!BUCKET_NAME!$/*"
                ]
            }
            ]
        }
        ~~~
    4. ini.txt
        ~~~
        [default]
        aws_access_key_id=AKIAXVTAGUUV5RXDXNPE
        aws_secret_access_key=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
        ~~~
5. If the repo exists on github, clone the repo; you should be good to go
6. If it's not in github, then.
7. Install/setup Mariadb.
    - sudo apt install mariadb-server
    - sudo mysql_secure_installation
    - sudo systemctl status mariadb (to check for autostart)
    - sudo mariadb
        - create user 'ica_user'@'localhost' identified by '2541';
        - grant all on \*.\* to 'ica_user'@localhost with grant option;
        - select User from mysql.user;
        - create database ica_schema;
        - show databases;
        - grant select, insert, update on ica_schema.* to ica_user@localhost;
        - flush privileges;
    - Use Prisma to set up initial database.
        - pnpm run prisma:reset
        
