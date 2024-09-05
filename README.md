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
  <a href="https://www.chartdb.io">Website</a>  &bull;
  <a href="https://app.chartdb.io/examples">Demo</a>
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
  <a href="https://x.com/chartdb_io">
    <img src="https://img.shields.io/twitter/follow/ChartDB?style=social"/>
  </a>

</h4>

---

<p align="center">
  <img width='700px' src="./public/ChartDB.png">
</p>

### 🎉 ChartDB

ChartDB is a powerful, web-based database diagramming editor.
Instantly visualize your database schema with a single **"Smart Query."** Customize diagrams, export SQL scripts, and access all features—no account required. Experience seamless database design here.

**What it does**:

-   **Instant Schema Import**
    Run a single query to instantly retrieve your database schema as JSON. This makes it incredibly fast to visualize your database schema, whether for documentation, team discussions, or simply understanding your data better.

-   **AI-Powered Export for Easy Migration**
    Our AI-driven export feature allows you to generate the DDL script in the dialect of your choice. Whether you’re migrating from MySQL to PostgreSQL or from SQLite to MariaDB, ChartDB simplifies the process by providing the necessary scripts tailored to your target database.
-   **Interactive Editing**
    Fine-tune your database schema using our intuitive editor. Easily make adjustments or annotations to better visualize complex structures.

### Status

ChartDB is currently in Public Beta. Star and watch this repository to get notified of updates.

### Supported Databases

-   ✅ PostgreSQL (<img src="./src/assets/postgresql_logo_2.png" width="15"/> + <img src="./src/assets/supabase.png" alt="Supabase" width="15"/> + <img src="./src/assets/timescale.png" alt="Timescale" width="15"/> )
-   ✅ MySQL
-   ✅ SQL Server
-   ✅ MariaDB
-   ✅ SQLite

## Getting Started

Use the [cloud version](https://app.chartdb.io/) or deploy locally:

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

```
npm install
VITE_OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> npm run build
```

### Running the Docker Container

```bash
docker build -t chartdb .
docker run -p 8080:80 chartdb
```

Open your browser and navigate to `http://localhost:8080`.

## Try it on our website

1. Go to [ChartDB.io](https://chartdb.io)
2. Click "Go to app"
3. Choose the database that you are using.
4. Take the magic query and run it in your database.
5. Copy and paste the resulting JSON set into ChartDB.
6. Enjoy Viewing & Editing!

## 💚 Community & Support

-   [Discord](https://discord.gg/QeFwyWSKwC) (For live discussion with the community and the ChartDB team)
-   [GitHub Issues](https://github.com/chartdb/chartdb/issues) (For any bugs and errors you encounter using ChartDB)
-   [Twitter](https://x.com/chartdb_io) (Get news fast)

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
