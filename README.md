# [UPVU 2.0][upvu_vision] – Upvu Web/Desktop client

![upvu](https://upvu.org/assets/github-cover.png)

Immutable, decentralized, uncensored, rewarding communities powered by Steem.

Fast, simple and clean source code with Reactjs + Typescript.

## Website

- [Production version][upvu_vision] - master branch

## Developers

Feel free to test it out and submit improvements and pull requests.

### Build instructions

##### Requirements

- node ^16.0.0
- yarn ^1.22.0

##### Clone

`$ git clone https://github.com/realmankwon/upvu_web`

`$ cd upvu_web`

##### Install dependencies

`$ yarn`

##### Edit config file or define environment variables

`$ nano src/config.ts`

##### Environment variables

- `USE_PRIVATE` - if instance has private api address and auth (0 or 1 value)
- `REDIS_URL` - support for caching amp pages

##### Start website in dev

`$ yarn start`

##### Pushing new code / Pull requests

- Make sure to branch off your changes from `development` branch.
- Make sure to run `yarn test` and add tests to your changes.
- Make sure new text, strings are added into `en-US.json` file only.
- Code on!

## Docker

You can use official `realmankwon/upvu:latest` image to run Vision locally, deploy it to staging or even production environment. The simplest way is to run it with following command:

```bash
docker run -it --rm -p 3000:3000 realmankwon/upvu:latest
```

Configure the instance using following environment variables:

- `USE_PRIVATE`

```bash
docker run -it --rm -p 3000:3000 -e USE_PRIVATE=1 realmankwon/upvu:latest
```

### Swarm

You can easily deploy a set of vision instances to your production environment, using example `docker-compose.yml` file. Docker Swarm will automatically keep it alive and load balance incoming traffic between the containers:

```bash
docker stack deploy -c docker-compose.yml -c docker-compose.production.yml vision
```

### Contributors

@realmankwon @happyberrysboy @donekim

## Issues

To report a non-critical issue, please file an issue on this GitHub project.

We will evaluate the risk and make a patch available before filing the issue.

[//]: # "LINKS"
[upvu]: https://upvu.org
[upvu_vision]: https://upvu.org
