<h1 align="center">
  <a href="https://chartdb.io#gh-light-mode-only">
    <img src="https://github.com/chartdb/chartdb/blob/main/src/assets/logo-light.png" width="400" height="70" alt="ChartDB">
  </a>
  <a href="https://chartdb.io##gh-dark-mode-only">
    <img src="https://github.com/chartdb/chartdb/blob/main/src/assets/logo-dark.png" width="400" height="70" alt="ChartDB">
  </a>
  <br>
</h1>

<p align="center">
  <b>Open-source database diagrams editor</b> <br />
  <b>No installations • No Database password required.</b> <br />
</p>

<h3 align="center">
  <a href="https://discord.gg/QeFwyWSKwC">Community</a>  &bull;
  <a href="https://www.chartdb.io?ref=github_readme">Website</a>  &bull;
  <a href="https://chartdb.io/templates?ref=github_readme">Examples</a>  &bull;
  <a href="https://app.chartdb.io?ref=github_readme">Demo</a>
</h3>

<h4 align="center">
  <a href="https://github.com/chartdb/chartdb?tab=AGPL-3.0-1-ov-file#readme">
    <img src="https://img.shields.io/github/license/chartdb/chartdb?color=blue" alt="ChartDB is released under the AGPL license." />
  </a>
  <a href="https://github.com/chartdb/chartdb/blob/main/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs welcome!" />
  </a>
  <a href="https://discord.gg/QeFwyWSKwC">
    <img src="https://img.shields.io/discord/1277047413705670678?color=5865F2&label=Discord&logo=discord&logoColor=white" alt="Discord community channel" />
  </a>
  <a href="https://x.com/intent/follow?screen_name=jonathanfishner">
    <img src="https://img.shields.io/twitter/follow/jonathanfishner?style=social"/>
  </a>

</h4>

---

<p align="center">
  <img width='700px' src="./public/chartdb.png">
</p>


## Custom Fork
This fork introduces a docker volume bind for storing and loading persistent diagrams from a volume.
It also introduces many customization functions like custom logo, name and colors.

Other features:
- clean mode support with the url param clean=true
- single table embedding
- hiding social links
- better table color picker

Mount a Docker volume to `/data`. Set `CHARTDB_API_TOKEN` to protect the
persistent storage API; the token is sent by the frontend for same-origin API
requests. If it is unset, authentication is disabled for local development.

In the mounted volume you will find a `config.json` file. This file allows you to perform custom configs. The possible options are:

```json
{
  "defaultDiagramId": "default id of diagram - will be auto generated",
  "appName": "App Name",
  "appLogo": "relative Path to logo file",
  "primaryColor": "#ffffff",
  "hideSocialLinks": true
}
```

__

### 🎉 ChartDB

ChartDB is a powerful, web-based database diagramming editor.
Instantly visualize your database schema with a single **"Smart Query."** Customize diagrams, export SQL scripts, and access all features—no account required. Experience seamless database design here.

**What it does**:

- **Instant Schema Import**
  Run a single query to instantly retrieve your database schema as JSON. This makes it incredibly fast to visualize your database schema, whether for documentation, team discussions, or simply understanding your data better.

- **AI-Powered Export for Easy Migration**
  Our AI-driven export feature allows you to generate the DDL script in the dialect of your choice. Whether you're migrating from MySQL to PostgreSQL or from SQLite to MariaDB, ChartDB simplifies the process by providing the necessary scripts tailored to your target database.
- **Interactive Editing**
  Fine-tune your database schema using our intuitive editor. Easily make adjustments or annotations to better visualize complex structures.

### Status

ChartDB is currently in Public Beta. Star and watch this repository to get notified of updates.

### Supported Databases

- ✅ PostgreSQL (<img src="./src/assets/postgresql_logo_2.png" width="15"/> + <img src="./src/assets/supabase.png" alt="Supabase" width="15"/> + <img src="./src/assets/timescale.png" alt="Timescale" width="15"/> )
- ✅ MySQL
- ✅ SQL Server
- ✅ MariaDB
- ✅ SQLite (<img src="./src/assets/sqlite_logo_2.png" width="15"/> + <img src="./src/assets/cloudflare_d1.png" alt="Cloudflare D1" width="15"/> Cloudflare D1)
- ✅ CockroachDB
- ✅ ClickHouse

## Getting Started

Use the [cloud version](https://app.chartdb.io?ref=github_readme_2) or deploy locally:

### How To Use

```bash
npm install
npm run dev
```

### Build

```bash
npm install
npm run build
```

Or like this if you want to have AI capabilities:

```bash
npm install
VITE_OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> npm run build
```

### Run the Docker Container

```bash
docker run \
  -e OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> \
  -e CHARTDB_API_TOKEN=<A_LONG_RANDOM_TOKEN> \
  -v chartdb-data:/data \
  -p 8080:80 \
  ghcr.io/derdeno/chartdb:latest
```

#### Build and Run locally

```bash
docker build -t chartdb .
docker run \
  -e OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> \
  -e CHARTDB_API_TOKEN=<A_LONG_RANDOM_TOKEN> \
  -v chartdb-data:/data \
  -p 8080:80 \
  chartdb
```

#### Using Custom Inference Server

Runtime configuration is supplied when the container starts; rebuilding the
image is not necessary when changing the endpoint or model:

```bash
docker run \
  -e OPENAI_API_ENDPOINT=<YOUR_ENDPOINT> \
  -e LLM_MODEL_NAME=<YOUR_MODEL_NAME> \
  -p 8080:80 chartdb
```

#### Docker environment variables

The Docker image reads the following variables when the container starts. The
values are exposed to the frontend through the runtime `/config.js` endpoint,
so you can change them without rebuilding the image.

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | empty | API key for OpenAI-compatible AI features. |
| `OPENAI_API_ENDPOINT` | empty | Custom OpenAI-compatible API endpoint, for example `http://host.docker.internal:8000/v1`. |
| `LLM_MODEL_NAME` | empty | Model name sent to the configured AI endpoint. |
| `CHARTDB_API_TOKEN` | empty | Optional Bearer token protecting the persistence API. Authentication is disabled when unset. |
| `CHARTDB_DATA_DIR` | `/data` | Directory for persisted diagrams, filters, configuration, and uploaded assets. Mount a volume here. |
| `HIDE_CHARTDB_CLOUD` | empty | Set to `true` to hide ChartDB Cloud-related UI. |
| `DISABLE_ANALYTICS` | empty | Set to `true` to disable analytics. |
| `PORT` | `80` | HTTP port used by the Node server inside the container. |
| `CHARTDB_STATIC_DIR` | `/usr/src/app/dist` | Advanced: directory containing the built frontend files. |

Example with the commonly used runtime options:

```bash
docker run \
  -e OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> \
  -e OPENAI_API_ENDPOINT=https://api.openai.com/v1 \
  -e LLM_MODEL_NAME=<YOUR_MODEL_NAME> \
  -e CHARTDB_API_TOKEN=<A_LONG_RANDOM_TOKEN> \
  -e HIDE_CHARTDB_CLOUD=true \
  -e DISABLE_ANALYTICS=true \
  -v chartdb-data:/data \
  -p 8080:80 \
  ghcr.io/derdeno/chartdb:latest
```

> **Privacy Note:** ChartDB includes privacy-focused analytics via Fathom Analytics. You can disable this by adding `-e DISABLE_ANALYTICS=true` to the run command.

> **Note:** You must configure either Option 1 (OpenAI API key) OR Option 2 (Custom endpoint and model name) for AI capabilities to work. Do not mix the two options.

Open your browser and navigate to `http://localhost:8080`.

Example configuration for a local vLLM server:

```bash
VITE_OPENAI_API_ENDPOINT=http://localhost:8000/v1
VITE_LLM_MODEL_NAME=Qwen/Qwen2.5-32B-Instruct-AWQ
```

## Try it on our website

1. Go to [ChartDB.io](https://chartdb.io?ref=github_readme_2)
2. Click "Go to app"
3. Choose the database that you are using.
4. Take the magic query and run it in your database.
5. Copy and paste the resulting JSON set into ChartDB.
6. Enjoy Viewing & Editing!

## 💚 Community & Support

- [Discord](https://discord.gg/QeFwyWSKwC) (For live discussion with the community and the ChartDB team)
- [GitHub Issues](https://github.com/chartdb/chartdb/issues) (For any bugs and errors you encounter using ChartDB)
- [Twitter](https://x.com/intent/follow?screen_name=jonathanfishner) (Get news fast)

## Contributing

We welcome community contributions, big or small, and are here to guide you along
the way. Message us in the [ChartDB Community Discord](https://discord.gg/QeFwyWSKwC).

For more information on how to contribute, please see our
[Contributing Guide](/CONTRIBUTING.md).

This project is released with a [Contributor Code of Conduct](/CODE_OF_CONDUCT.md).
By participating in this project, you agree to follow its terms.

Thank you for helping us make ChartDB better for everyone :heart:.

## License

ChartDB is licensed under the [GNU Affero General Public License v3.0](LICENSE)
