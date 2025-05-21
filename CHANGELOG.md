# Changelog

## [1.12.0](https://github.com/chartdb/chartdb/compare/v1.11.0...v1.12.0) (2025-05-20)


### Features

* **areas:** implement area to enable logical diagram arrangement ([#661](https://github.com/chartdb/chartdb/issues/661)) ([92e3ec7](https://github.com/chartdb/chartdb/commit/92e3ec785c91f7f19881c6d9d0692257af4651bc))
* **examples:** update examples to have areas ([#677](https://github.com/chartdb/chartdb/issues/677)) ([21c9129](https://github.com/chartdb/chartdb/commit/21c9129e14670c744950cd43a5cbdd4b7d47c639))
* **image-export:** add transparent and pattern export image toggles ([#671](https://github.com/chartdb/chartdb/issues/671)) ([6b8d637](https://github.com/chartdb/chartdb/commit/6b8d637b757b94630ecd7521b4a2c99634afae69))


### Bug Fixes

* add sorting based on how common the datatype on side-panel ([#651](https://github.com/chartdb/chartdb/issues/651)) ([3a1b8d1](https://github.com/chartdb/chartdb/commit/3a1b8d1db13d8dd7cb6cbe5ef8c5a60faccfeae5))
* **canvas:** disable edit area name on read only ([#666](https://github.com/chartdb/chartdb/issues/666)) ([9402822](https://github.com/chartdb/chartdb/commit/9402822fa31f8cd94fe7971277839ee5425e29bf))
* **canvas:** read only mode ([#665](https://github.com/chartdb/chartdb/issues/665)) ([651fe36](https://github.com/chartdb/chartdb/commit/651fe361fce61fe0577d2593f268131e9ca359d0))
* **clone:** add areas to clone diagram ([#664](https://github.com/chartdb/chartdb/issues/664)) ([aee1713](https://github.com/chartdb/chartdb/commit/aee1713aecdd5e54228a16cbc3c4fc184661c56b))
* **dbml-editor:** add inline refs mode + fix issues with DBML syntax ([#687](https://github.com/chartdb/chartdb/issues/687)) ([fbf2fe9](https://github.com/chartdb/chartdb/commit/fbf2fe919c2168c715f8231c0246753b19635f14))
* **dbml-editor:** remove invalid fields before showing DBML + warning ([#683](https://github.com/chartdb/chartdb/issues/683)) ([5759241](https://github.com/chartdb/chartdb/commit/5759241573db204183c92599588d59f4aadaeafb))
* **ddl-import:** fix datatypes when importing via ddl ([#696](https://github.com/chartdb/chartdb/issues/696)) ([a1144bb](https://github.com/chartdb/chartdb/commit/a1144bbf761a0daedd546b5d9b92300be59e0157))
* **ddl:** inline fks ddl script ([#701](https://github.com/chartdb/chartdb/issues/701)) ([5849e45](https://github.com/chartdb/chartdb/commit/5849e4586c7c2a7cd86bd064df8916b130fc6234))
* **dependencies:** hide icon when diagram has no dependencies ([#684](https://github.com/chartdb/chartdb/issues/684)) ([547149d](https://github.com/chartdb/chartdb/commit/547149da44db6d3d1e36d619d475fe52ff83a472))
* **examples:** add loader ([#678](https://github.com/chartdb/chartdb/issues/678)) ([90a20dd](https://github.com/chartdb/chartdb/commit/90a20dd1b0277c4aee848fae5ed7a8347c5ba77d))
* **examples:** fix clone examples ([#679](https://github.com/chartdb/chartdb/issues/679)) ([1778abb](https://github.com/chartdb/chartdb/commit/1778abb683d575af244edcd9a11f8d03f903f719))
* **expanded-table:** persist expanded state across renders ([#707](https://github.com/chartdb/chartdb/issues/707)) ([54d5e96](https://github.com/chartdb/chartdb/commit/54d5e96a6db1e3abd52229a89ac503ff31885386))
* **export image:** Fix usage of advanced options accordion ([#703](https://github.com/chartdb/chartdb/issues/703)) ([0ce85cf](https://github.com/chartdb/chartdb/commit/0ce85cf76b733f441f661608278c0db3122c5074))
* **import-database:** auto detect when user try to import ddl script ([#698](https://github.com/chartdb/chartdb/issues/698)) ([5a5e64a](https://github.com/chartdb/chartdb/commit/5a5e64abef510cff28b3d8972520d0b9df29b024))
* **import-database:** remove view_definition when importing via query ([#702](https://github.com/chartdb/chartdb/issues/702)) ([481ad3c](https://github.com/chartdb/chartdb/commit/481ad3c8449f469bf2b4418e4cdcc5b5608dfd36))
* **import-json:** for broken json imports ([#697](https://github.com/chartdb/chartdb/issues/697)) ([2368e0d](https://github.com/chartdb/chartdb/commit/2368e0d2639021c4a11a8e5131d6af44fb6a47db))
* **import-json:** simplify import script for fixing invalid JSON ([#681](https://github.com/chartdb/chartdb/issues/681)) ([226e6cf](https://github.com/chartdb/chartdb/commit/226e6cf1ce4d2edcfbee6a4de7ab0bc0cfeb17fe))
* **import:** dbml and query - senetize before import ([#699](https://github.com/chartdb/chartdb/issues/699)) ([34c0a71](https://github.com/chartdb/chartdb/commit/34c0a7163f47bde7ddfaa8f044341e3c971b7e03))
* **navbar:** open diagram directly from diagram icon ([#694](https://github.com/chartdb/chartdb/issues/694)) ([7db86dc](https://github.com/chartdb/chartdb/commit/7db86dcf8c97d34b056e4b5b85a0dda0438322ea))
* **performance:** Only render visible ([#672](https://github.com/chartdb/chartdb/issues/672)) ([83c4333](https://github.com/chartdb/chartdb/commit/83c43332d497e9fc148a18b9cb4d9ecc85e44183))
* **performance:** update field only when changed ([#685](https://github.com/chartdb/chartdb/issues/685)) ([d3ddf7c](https://github.com/chartdb/chartdb/commit/d3ddf7c51eaa4b9cddb961defd52d423f39f281d))
* **postgres:** fix import of postgres fks ([#700](https://github.com/chartdb/chartdb/issues/700)) ([89e3cea](https://github.com/chartdb/chartdb/commit/89e3ceab00defaabc079e165fc90e92ca00722cf))
* **schema:** add areas to diagram schema ([#663](https://github.com/chartdb/chartdb/issues/663)) ([ecfa148](https://github.com/chartdb/chartdb/commit/ecfa14829bcb1b813c7b154b4bd59f24e3032d8f))
* **sql-script:** change ddl to be sql-script ([#710](https://github.com/chartdb/chartdb/issues/710)) ([487fb2d](https://github.com/chartdb/chartdb/commit/487fb2d5c17b70ac54aa17af9a2ac9aded6b40ba))
* **table:** enhance field focus behavior to include table hover state ([#676](https://github.com/chartdb/chartdb/issues/676)) ([19d2d0b](https://github.com/chartdb/chartdb/commit/19d2d0bddd3a464995b79e97e6caf6e652836081))
* **translations:** Add some translations for ru-RU language ([#690](https://github.com/chartdb/chartdb/issues/690)) ([97d01d7](https://github.com/chartdb/chartdb/commit/97d01d72014e473c42348c9ebcbe7a0b973d31aa))

## [1.11.0](https://github.com/chartdb/chartdb/compare/v1.10.0...v1.11.0) (2025-04-17)


### Features

* add sidebar footer help buttons ([#650](https://github.com/chartdb/chartdb/issues/650)) ([fc46cbb](https://github.com/chartdb/chartdb/commit/fc46cbb8933761c7bac3604664f7de812f6f5b6b))
* **import-sql:** import postgresql via SQL (DDL script) ([#639](https://github.com/chartdb/chartdb/issues/639)) ([f7a6e0c](https://github.com/chartdb/chartdb/commit/f7a6e0cb5e4921dd9540739f9da269858e7ca7be))


### Bug Fixes

* **import:** display query result formatted ([#644](https://github.com/chartdb/chartdb/issues/644)) ([caa81c2](https://github.com/chartdb/chartdb/commit/caa81c24a6535bc87129c38622aac5a62a6d479d))
* **import:** strict parse of database metadata ([#635](https://github.com/chartdb/chartdb/issues/635)) ([0940d72](https://github.com/chartdb/chartdb/commit/0940d72d5d3726650213257639f24ba47e729854))
* **mobile:** fix create diagram modal on mobile ([#646](https://github.com/chartdb/chartdb/issues/646)) ([25c4b42](https://github.com/chartdb/chartdb/commit/25c4b4253849575d7a781ed197281e2a35e7184a))
* **mysql-ddl:** update the script to import - for create fks ([#642](https://github.com/chartdb/chartdb/issues/642)) ([cf81253](https://github.com/chartdb/chartdb/commit/cf81253535ca5a3b8a65add78287c1bdb283a1c7))
* **performance:** Import deps dynamically ([#652](https://github.com/chartdb/chartdb/issues/652)) ([e3cb627](https://github.com/chartdb/chartdb/commit/e3cb62788c13f149e35e1a5020191bd43d14b52f))
* remove unused links from help menu ([#623](https://github.com/chartdb/chartdb/issues/623)) ([85275e5](https://github.com/chartdb/chartdb/commit/85275e5dd6e7845f06f682eeceda7932fc87e875))
* **sidebar:** turn sidebar to responsive for mobile ([#658](https://github.com/chartdb/chartdb/issues/658)) ([ce2389f](https://github.com/chartdb/chartdb/commit/ce2389f135d399d82c9848335d31174bac8a3791))

## [1.10.0](https://github.com/chartdb/chartdb/compare/v1.9.0...v1.10.0) (2025-03-25)


### Features

* **cloudflare-d1:** add support to cloudflare-d1 + wrangler cli ([#632](https://github.com/chartdb/chartdb/issues/632)) ([794f226](https://github.com/chartdb/chartdb/commit/794f2262092fbe36e27e92220221ed98cb51ae37))


### Bug Fixes

* **dbml-editor:** dealing with dbml editor for non-generic db-type ([#624](https://github.com/chartdb/chartdb/issues/624)) ([14de30b](https://github.com/chartdb/chartdb/commit/14de30b7aaa0ccaca8372f0213b692266d53f0de))
* **export-sql:** move from AI sql-export for MySQL&MariaDB to deterministic script ([#628](https://github.com/chartdb/chartdb/issues/628)) ([2fbf347](https://github.com/chartdb/chartdb/commit/2fbf3476b87f1177af17de8242a74d195dae5f35))
* **export-sql:** move from AI sql-export for postgres to deterministic script ([#626](https://github.com/chartdb/chartdb/issues/626)) ([18f228c](https://github.com/chartdb/chartdb/commit/18f228ca1d5a6c6056cb7c3bfc24d04ec470edf1))
* **export-sql:** move from AI sql-export for sqlite to deterministic script ([#627](https://github.com/chartdb/chartdb/issues/627)) ([897ac60](https://github.com/chartdb/chartdb/commit/897ac60a829a00e9453d670cceeb2282e9e93f1c))
* **sidebar:** add sidebar for diagram objects ([#618](https://github.com/chartdb/chartdb/issues/618)) ([63b5ba0](https://github.com/chartdb/chartdb/commit/63b5ba0bb9934c4e5c5d0d1b6f995afbbd3acf36))
* **sidebar:** opens sidepanel in case its closed and click on sidebar ([#620](https://github.com/chartdb/chartdb/issues/620)) ([3faa39e](https://github.com/chartdb/chartdb/commit/3faa39e7875d836dfe526d94a10f8aed070ac1c1))

## [1.9.0](https://github.com/chartdb/chartdb/compare/v1.8.1...v1.9.0) (2025-03-13)


### Features

* **canvas:** highlight the Show-All button when No-Tables are visible in the canvas ([#612](https://github.com/chartdb/chartdb/issues/612)) ([62beb68](https://github.com/chartdb/chartdb/commit/62beb68fa1ec22ccd4fe5e59a8ceb9d3e8f6d374))
* **chart max length:** add support for edit char max length ([#613](https://github.com/chartdb/chartdb/issues/613)) ([09b1275](https://github.com/chartdb/chartdb/commit/09b12754757b9625ca287d91a92cf0d83c9e2b89))
* **chart max length:** enable edit length from data type select box ([#616](https://github.com/chartdb/chartdb/issues/616)) ([bd67ccf](https://github.com/chartdb/chartdb/commit/bd67ccfbcf66b919453ca6c0bfd71e16772b3d8e))


### Bug Fixes

* **cardinality:** set true as default ([#583](https://github.com/chartdb/chartdb/issues/583)) ([2939320](https://github.com/chartdb/chartdb/commit/2939320a15a9ccd9eccfe46c26e04ca1edca2420))
* **performance:** Optimize performance of field comments editing ([#610](https://github.com/chartdb/chartdb/issues/610)) ([5dd7fe7](https://github.com/chartdb/chartdb/commit/5dd7fe75d1b0378ba406c75183c5e2356730c3b4))
* remove Buckle dialog ([#617](https://github.com/chartdb/chartdb/issues/617)) ([502472b](https://github.com/chartdb/chartdb/commit/502472b08342be425e66e2b6c94e5fe37ba14aa9))
* **shorcuts:** add shortcut to toggle the theme ([#602](https://github.com/chartdb/chartdb/issues/602)) ([a643852](https://github.com/chartdb/chartdb/commit/a6438528375ab54d3ec7d80ac6b6ddd65ea8cf1e))

## [1.8.1](https://github.com/chartdb/chartdb/compare/v1.8.0...v1.8.1) (2025-03-02)


### Bug Fixes

* **add-docs:** add link to ChartDB documentation ([#597](https://github.com/chartdb/chartdb/issues/597)) ([b55d631](https://github.com/chartdb/chartdb/commit/b55d631146ff3a1f7d63c800d44b5d3d3a223c76))
* components config ([#591](https://github.com/chartdb/chartdb/issues/591)) ([cbc4e85](https://github.com/chartdb/chartdb/commit/cbc4e85a14e24a43f9ff470518f8fe2845046bdb))
* **docker config:** Environment Variable Handling and Configuration Logic ([#605](https://github.com/chartdb/chartdb/issues/605)) ([d6919f3](https://github.com/chartdb/chartdb/commit/d6919f30336cc846fe6e6505b5a5278aa14dcce6))
* **empty-state:** show diff buttons on import-dbml when triggered by empty ([#574](https://github.com/chartdb/chartdb/issues/574)) ([4834247](https://github.com/chartdb/chartdb/commit/48342471ac231922f2ca4455b74a9879127a54f1))
* **i18n:** add [FR] translation ([#579](https://github.com/chartdb/chartdb/issues/579)) ([ab89bad](https://github.com/chartdb/chartdb/commit/ab89bad6d544ba4c339a3360eeec7d29e5579511))
* **img-export:** add ChartDB watermark to exported image ([#588](https://github.com/chartdb/chartdb/issues/588)) ([b935b7f](https://github.com/chartdb/chartdb/commit/b935b7f25111d5f72b7f8d7c552a4ea5974f791e))
* **import-mssql:** fix import/export scripts to handle data correctly ([#598](https://github.com/chartdb/chartdb/issues/598)) ([e06eb2a](https://github.com/chartdb/chartdb/commit/e06eb2a48e6bd3bcf352f4bcf128214c7da4c1b1))
* **menu-backup:** update export to be backup ([#590](https://github.com/chartdb/chartdb/issues/590)) ([26a0a5b](https://github.com/chartdb/chartdb/commit/26a0a5b550ef5e47e89b00d0232dc98936f63f23))
* open create new diagram when there is no diagram ([#594](https://github.com/chartdb/chartdb/issues/594)) ([ef11892](https://github.com/chartdb/chartdb/commit/ef118929ad5d5cbfae0290061bd8ea30bd262496))
* **open diagram:** in case there is no diagram, opens the dialog ([#593](https://github.com/chartdb/chartdb/issues/593)) ([68f4819](https://github.com/chartdb/chartdb/commit/68f48190c93f155398cca15dd7af2a025de2d45f))
* **side-panel:** simplify how to add field and index ([#573](https://github.com/chartdb/chartdb/issues/573)) ([a1c0cf1](https://github.com/chartdb/chartdb/commit/a1c0cf102add4fb235e913e75078139b3961341b))
* **sql_server_export:** use sql server export ([#600](https://github.com/chartdb/chartdb/issues/600)) ([56382a9](https://github.com/chartdb/chartdb/commit/56382a9fdc5e3044f8811873dd8a79f590771896))
* **sqlite-import:** import nuallable columns correctly + add json type ([#571](https://github.com/chartdb/chartdb/issues/571)) ([deb2184](https://github.com/chartdb/chartdb/commit/deb218423f77f0c0945a93005696456f62b00ce3))

## [1.8.0](https://github.com/chartdb/chartdb/compare/v1.7.0...v1.8.0) (2025-02-13)


### Features

* **dbml-import:** add error highlighting for dbml imports ([#556](https://github.com/chartdb/chartdb/issues/556)) ([190e4f4](https://github.com/chartdb/chartdb/commit/190e4f4ffa834fa621f264dc608ca3f3b393a331))
* **docker image:** add support for custom inference servers ([#543](https://github.com/chartdb/chartdb/issues/543)) ([1878083](https://github.com/chartdb/chartdb/commit/1878083056ea4db7a05cdeeb38a4f7b9f5f95bd1))


### Bug Fixes

* **canvas:** add right-click option to create relationships ([#568](https://github.com/chartdb/chartdb/issues/568)) ([e993f15](https://github.com/chartdb/chartdb/commit/e993f1549c4c86bb9e7e36062db803ba6613b3b3))
* **canvas:** locate table from canvas ([#560](https://github.com/chartdb/chartdb/issues/560)) ([dc404c9](https://github.com/chartdb/chartdb/commit/dc404c9d7ee272c93aac69646bac859829a5234e))
* **docker:** add option to hide popups ([#580](https://github.com/chartdb/chartdb/issues/580)) ([a96c2e1](https://github.com/chartdb/chartdb/commit/a96c2e107838d2dc13b586923fd9dbe06598cdd8))
* **export-sql:** show create script for only filtered schemas ([#570](https://github.com/chartdb/chartdb/issues/570)) ([85fd14f](https://github.com/chartdb/chartdb/commit/85fd14fa02bb2879c36bba53369dbf2e7fa578d4))
* **i18n:** fix Ukrainian ([#554](https://github.com/chartdb/chartdb/issues/554)) ([7b62719](https://github.com/chartdb/chartdb/commit/7b6271962a99bfe5ffbd0176e714c76368ef5c41))
* **import dbml:** add import for indexes ([#566](https://github.com/chartdb/chartdb/issues/566)) ([0db67ea](https://github.com/chartdb/chartdb/commit/0db67ea42a5f9585ca1d246db7a7ff0239bec0ba))
* **import-query:** improve the cleanup for messy json input ([#562](https://github.com/chartdb/chartdb/issues/562)) ([93d59f8](https://github.com/chartdb/chartdb/commit/93d59f8887765098d040a3184aaee32112f67267))
* **index unique:** extract unique toggle for faster editing ([#559](https://github.com/chartdb/chartdb/issues/559)) ([dd4324d](https://github.com/chartdb/chartdb/commit/dd4324d64f7638ada5c022a2ab38bd8e6986af25))
* **mssql-import:** improve script readability by adding edition comment ([#572](https://github.com/chartdb/chartdb/issues/572)) ([be65328](https://github.com/chartdb/chartdb/commit/be65328f24b0361638b9e2edb39eaa9906e77f67))
* **realtionships section:** add the schema to source/target tables ([#561](https://github.com/chartdb/chartdb/issues/561)) ([b9e621b](https://github.com/chartdb/chartdb/commit/b9e621bd680730a0ffbf1054d735bfa418711cae))
* **sqlserver-import:** open ssms guide when max chars ([#565](https://github.com/chartdb/chartdb/issues/565)) ([9c485b3](https://github.com/chartdb/chartdb/commit/9c485b3b01a131bf551c7e95916b0c416f6aa0b5))
* **table actions:** fix size of table actions ([#578](https://github.com/chartdb/chartdb/issues/578)) ([26d95ee](https://github.com/chartdb/chartdb/commit/26d95eed25d86452d9168a9d93a301ba50d934e3))

## [1.7.0](https://github.com/chartdb/chartdb/compare/v1.6.1...v1.7.0) (2025-02-03)


### Features

* **dbml-editor:** add dbml editor in side pannel ([#534](https://github.com/chartdb/chartdb/issues/534)) ([88be6c1](https://github.com/chartdb/chartdb/commit/88be6c1fd4a7e1f20937e8204c14d8fc1c2665b4))
* **import-dbml:** add import dbml functionality ([#549](https://github.com/chartdb/chartdb/issues/549)) ([b424518](https://github.com/chartdb/chartdb/commit/b424518212290a870fdb7c420a303f65f5901429))


### Bug Fixes

* **canvas edit:** add option to edit names in canvas ([#536](https://github.com/chartdb/chartdb/issues/536)) ([0dcc9b9](https://github.com/chartdb/chartdb/commit/0dcc9b9568cfe749d44d2e93cb365ba3d3a1e71c))
* **dbml-editor:** add shortcuts to dbml and filter: [#534](https://github.com/chartdb/chartdb/issues/534) ([#535](https://github.com/chartdb/chartdb/issues/535)) ([3b3be08](https://github.com/chartdb/chartdb/commit/3b3be086b1e8d5acf999f8504580d9e2f956f7da))
* **dbml:** add error handling ([#545](https://github.com/chartdb/chartdb/issues/545)) ([fef6d3f](https://github.com/chartdb/chartdb/commit/fef6d3f4996130a3769d1f25b4b1f2090293a1bf))
* **empty-state:** fix dark-mode for empty-state ([#547](https://github.com/chartdb/chartdb/issues/547)) ([99a8201](https://github.com/chartdb/chartdb/commit/99a820139861546a012d7b562ddbb9b77698151a))
* **examples:** fix employee example dbml ([#544](https://github.com/chartdb/chartdb/issues/544)) ([2118bce](https://github.com/chartdb/chartdb/commit/2118bce0f00d55eb19d22b9fa2d4964ba2533a09))
* **i18n:** translation/Ukrainian ([#529](https://github.com/chartdb/chartdb/issues/529)) ([ff3269e](https://github.com/chartdb/chartdb/commit/ff3269ec0510bbae4bc114e65a1ea86a656e8785))
* **open-diagram:** add arrow keys navigation in open diagram dialog ([#537](https://github.com/chartdb/chartdb/issues/537)) ([14f11c2](https://github.com/chartdb/chartdb/commit/14f11c27a7ad5b990131c8495148cabf12835082))
* **performance:** fix bundle size ([#551](https://github.com/chartdb/chartdb/issues/551)) ([4c93326](https://github.com/chartdb/chartdb/commit/4c93326bb6e3eaa143373c500a0c641e95a53fb9))
* **performance:** reduce bundle size ([#553](https://github.com/chartdb/chartdb/issues/553)) ([004d530](https://github.com/chartdb/chartdb/commit/004d530880a50dea6e9786eb9ae63cf592a4d852))
* **performance:** resolve error on startup ([#552](https://github.com/chartdb/chartdb/issues/552)) ([fd2cc9f](https://github.com/chartdb/chartdb/commit/fd2cc9fcfc8f4a9f0bc79def47d89114159392fb))
* **psql-import:** remove typo for import command (psql) ([#546](https://github.com/chartdb/chartdb/issues/546)) ([eb9b41e](https://github.com/chartdb/chartdb/commit/eb9b41e4f656bec1451c45763f4ea5b547aeec5c))
* **scroll:** fix scroll area ([#550](https://github.com/chartdb/chartdb/issues/550)) ([ef3d7a8](https://github.com/chartdb/chartdb/commit/ef3d7a8b67431e923b75bf8287b86bbc8abe723b))

## [1.6.1](https://github.com/chartdb/chartdb/compare/v1.6.0...v1.6.1) (2025-01-26)


### Bug Fixes

* change empty state image ([#531](https://github.com/chartdb/chartdb/issues/531)) ([42d4cba](https://github.com/chartdb/chartdb/commit/42d4cbac8ce352e0e4e155d7003bfb85296b897f))
* **chat-type:** remove typo of char datatype in examples ([#530](https://github.com/chartdb/chartdb/issues/530)) ([58231c9](https://github.com/chartdb/chartdb/commit/58231c91393de30ebff817f0ebc57a5c5579f106))
* **empty_state:** customize empty state ([#533](https://github.com/chartdb/chartdb/issues/533)) ([1643e7b](https://github.com/chartdb/chartdb/commit/1643e7bdeb1bbaf081ab064e871d102c87243c0a))
* **Image Export:** importing css rules error while download image ([#524](https://github.com/chartdb/chartdb/issues/524)) ([e9e2736](https://github.com/chartdb/chartdb/commit/e9e2736cb2203702d53df9afc30b8e989a8c9953))
* **shortcuts:** add zoom all shortcut ([#528](https://github.com/chartdb/chartdb/issues/528)) ([7452ca6](https://github.com/chartdb/chartdb/commit/7452ca6965b0332a93b686c397ddf51013e42506))
* **filter-tables:** show clean filter if no-results ([#532](https://github.com/chartdb/chartdb/issues/532)) ([c36cd33](https://github.com/chartdb/chartdb/commit/c36cd33180badaa9b7f9e27c765f19cb03a50ccd))

## [1.6.0](https://github.com/chartdb/chartdb/compare/v1.5.1...v1.6.0) (2025-01-02)


### Features

* **view-menu:** add toggle for mini map visibility ([#496](https://github.com/chartdb/chartdb/issues/496)) ([#505](https://github.com/chartdb/chartdb/issues/505)) ([8abf2a7](https://github.com/chartdb/chartdb/commit/8abf2a7bfcc36d39e60ac133b0e5e569de1bbc72))


### Bug Fixes

* add loadDiagramFromData logic to chartdb provider ([#513](https://github.com/chartdb/chartdb/issues/513)) ([ee659ea](https://github.com/chartdb/chartdb/commit/ee659eaa038a94ee13801801e84152df4d79683d))
* **dependency:** upgrade react query to v7 - clean console warnings ([#504](https://github.com/chartdb/chartdb/issues/504)) ([7c5db08](https://github.com/chartdb/chartdb/commit/7c5db0848e49dfdb7e7120f77003d1e37f8d71b0))
* **i18n:** translation/Arabic ([#509](https://github.com/chartdb/chartdb/issues/509)) ([4b43f72](https://github.com/chartdb/chartdb/commit/4b43f720e90e49d5461e68d188e3865000f52497))

## [1.5.1](https://github.com/chartdb/chartdb/compare/v1.5.0...v1.5.1) (2024-12-15)


### Bug Fixes

* **export:** fix SQL server field.nullable type to boolean ([#486](https://github.com/chartdb/chartdb/issues/486)) ([a151f56](https://github.com/chartdb/chartdb/commit/a151f56b5d950e0b5cc54363684ada95889024b3))
* **readme:** Update README.md - add CockroachDB ([#482](https://github.com/chartdb/chartdb/issues/482)) ([2b6b733](https://github.com/chartdb/chartdb/commit/2b6b73326155f18d6d56779c0657a3506e2d2cde))

## [1.5.0](https://github.com/chartdb/chartdb/compare/v1.4.0...v1.5.0) (2024-12-11)


### Features

* **CockroachDB:** Add CockroachDB support ([#472](https://github.com/chartdb/chartdb/issues/472)) ([5409288](https://github.com/chartdb/chartdb/commit/54092883883b135f6ace51d86754b1df76603d30))
* **i18n:** translate share and dialog sections in Indonesian locale files ([#468](https://github.com/chartdb/chartdb/issues/468)) ([3574cec](https://github.com/chartdb/chartdb/commit/3574cecc7c73dcab404b82115d20e1ad0cd26b37))


### Bug Fixes

* **core:** fix update diagram id ([#477](https://github.com/chartdb/chartdb/issues/477)) ([348f805](https://github.com/chartdb/chartdb/commit/348f80568e0f686ee478147fdc43a5d43b5c1ebb))
* **dialogs:** fix footer position on dialogs ([#470](https://github.com/chartdb/chartdb/issues/470)) ([2309306](https://github.com/chartdb/chartdb/commit/2309306ef590783b00a2489209092107dd9a3788))
* **sql-server import:** nullable should be boolean instead of string ([#480](https://github.com/chartdb/chartdb/issues/480)) ([635fb53](https://github.com/chartdb/chartdb/commit/635fb53c9f7ebd1e5ef4d9274af041edc08f04c3))

## [1.4.0](https://github.com/chartdb/chartdb/compare/v1.3.1...v1.4.0) (2024-12-02)


### Features

* **add templates:** add six more templates  ([#452](https://github.com/chartdb/chartdb/issues/452)) ([be1b109](https://github.com/chartdb/chartdb/commit/be1b109f23e62df4cc63fa8914c2754f7809cc08))
* **add templates:** add six more templates (django-axes, laravel-activitylog, octobox, pay-rails, pixelfed, polr) ([#460](https://github.com/chartdb/chartdb/issues/460)) ([03772f6](https://github.com/chartdb/chartdb/commit/03772f6b4f99f9c4350356aa0f2a4666f4f1794d))
* **add templates:** add six more templates (reversion, screeenly, staytus, deployer, devise, talk) ([#457](https://github.com/chartdb/chartdb/issues/457)) ([ddeef3b](https://github.com/chartdb/chartdb/commit/ddeef3b134efa893e1c1e15e2f87c27157200e2d))
* **clickhouse:** add ClickHouse support ([#463](https://github.com/chartdb/chartdb/issues/463)) ([807cd22](https://github.com/chartdb/chartdb/commit/807cd22e0c739f339fa07fe1d2f043c5411ae41f))
* **i18n:** Added bangla translations ([#432](https://github.com/chartdb/chartdb/issues/432)) ([885eb71](https://github.com/chartdb/chartdb/commit/885eb719de577c2652fbed1ed287f38fcc98c148))
* **side-panel:** Add functionality of order tables by drag & drop ([#425](https://github.com/chartdb/chartdb/issues/425)) ([a0e966b](https://github.com/chartdb/chartdb/commit/a0e966b64f8070d4595d47b2fb39e8bbf427b794))


### Bug Fixes

* **clipboard:** defensive for navigator clipboard ([#462](https://github.com/chartdb/chartdb/issues/462)) ([5fc10a7](https://github.com/chartdb/chartdb/commit/5fc10a7e649fc5877bb297b519b1b6a8b81f1323))
* **import-database:** update database type after importing into an existing generic diagra ([#456](https://github.com/chartdb/chartdb/issues/456)) ([a8fe491](https://github.com/chartdb/chartdb/commit/a8fe491c1b5a30d9f4144cefa9111dd3dfd5df1a))
* **Last Saved:** Translate the "last saved" relative date message ([#400](https://github.com/chartdb/chartdb/issues/400)) ([d45677e](https://github.com/chartdb/chartdb/commit/d45677e92d72efc6cea8f865ce46f0be6ec9961f))
* **mariadb-types:** Add uuid data type ([#459](https://github.com/chartdb/chartdb/issues/459)) ([94656ec](https://github.com/chartdb/chartdb/commit/94656ec7a5435c2da262fb3bc6a6d381d554b0c1))
* window type ([#454](https://github.com/chartdb/chartdb/issues/454)) ([9c7d03c](https://github.com/chartdb/chartdb/commit/9c7d03c285ff6f818eef3199c9b7a530d03a1fec))

## [1.3.1](https://github.com/chartdb/chartdb/compare/v1.3.0...v1.3.1) (2024-11-26)


### Bug Fixes

* **docker:** make OPENAI_API_KEY optional in docker run ([#448](https://github.com/chartdb/chartdb/issues/448)) ([4bb4766](https://github.com/chartdb/chartdb/commit/4bb4766e1ac8d69e138668eb8a46de5affe62ceb))

## [1.3.0](https://github.com/chartdb/chartdb/compare/v1.2.0...v1.3.0) (2024-11-25)


### Features

* **side panel:** collapsible side panel on desktop view + keyboard shortcut ([#439](https://github.com/chartdb/chartdb/issues/439)) ([70f545f](https://github.com/chartdb/chartdb/commit/70f545f78bab9c510a6e5936fa5b259b806b6c69))


### Bug Fixes

* **dialogs:** fix height of dialogs for small screens ([#440](https://github.com/chartdb/chartdb/issues/440)) ([667685e](https://github.com/chartdb/chartdb/commit/667685ed0f6a8cc61ae86b3ba60e052fbe6a9e1a))
* **drawer:** set fix min size ([#429](https://github.com/chartdb/chartdb/issues/429)) ([c5e0ea6](https://github.com/chartdb/chartdb/commit/c5e0ea6fa4017666ff3bc1e3071c487df48afd3d))
* **export-sql:** add unique to export script ([#422](https://github.com/chartdb/chartdb/issues/422)) ([b75c6fe](https://github.com/chartdb/chartdb/commit/b75c6fe4e78f3e2058be680f2fa0442db3b4a6bd))
* fix layout warnings ([#434](https://github.com/chartdb/chartdb/issues/434)) ([94ec43b](https://github.com/chartdb/chartdb/commit/94ec43b60845bb8c3592ce1b1450ca0171a53f99))
* **i18n:** add bahasa indonesia translation ([#331](https://github.com/chartdb/chartdb/issues/331)) ([ab07da0](https://github.com/chartdb/chartdb/commit/ab07da0b031f0d4050ff6b44ddcb94cb6c0010b6))
* **i18n:** add missing type to vi.ts ([#444](https://github.com/chartdb/chartdb/issues/444)) ([e77ee60](https://github.com/chartdb/chartdb/commit/e77ee60a5b47e0854d11b0ee2f16d6956737d0ff))
* **i18n:** Add Telugu Language ([#352](https://github.com/chartdb/chartdb/issues/352)) ([8749591](https://github.com/chartdb/chartdb/commit/8749591be036e131de4bfeed1e6eece8d62980dd))
* **i18n:** add Turkish translations ([#315](https://github.com/chartdb/chartdb/issues/315)) ([d9fcbee](https://github.com/chartdb/chartdb/commit/d9fcbeec726b7bde9f7d202bf09dc6b617e3ad80))
* **i18n:** add Vietnamese translations ([#435](https://github.com/chartdb/chartdb/issues/435)) ([6c65c2e](https://github.com/chartdb/chartdb/commit/6c65c2e9cce600b9778b84ce5b5f1625dc6f1a58))
* **i18n:** Translating to Gujarati language ([#433](https://github.com/chartdb/chartdb/issues/433)) ([2940431](https://github.com/chartdb/chartdb/commit/2940431efa1a6aa54d80c61d5e05f0ad47cd67ba))
* **i18n:** Translation of the export error into Russian ([#418](https://github.com/chartdb/chartdb/issues/418)) ([7c3c628](https://github.com/chartdb/chartdb/commit/7c3c62860efc98d3aabf2132a79ac945ffc8315a))
* **i18n:** update korean for 1.2.0 ([#419](https://github.com/chartdb/chartdb/issues/419)) ([8397bef](https://github.com/chartdb/chartdb/commit/8397bef3924610d94661aae99c55ba4fa376a186))
* **import script:** remove double quotes ([#442](https://github.com/chartdb/chartdb/issues/442)) ([fb702c8](https://github.com/chartdb/chartdb/commit/fb702c87ce5254bf6e0209c692305f5086956090))
* **share:** fix export to handle broken indexes & relationships ([#416](https://github.com/chartdb/chartdb/issues/416)) ([4be3592](https://github.com/chartdb/chartdb/commit/4be3592cf4d160be83ddf1db01ffe9afdef119fa))
* **templates:** add Five more templates (bouncer, cabot, feedbin, Pythonic, flarum, freescout) ([#441](https://github.com/chartdb/chartdb/issues/441)) ([eaa0678](https://github.com/chartdb/chartdb/commit/eaa067814fd96fcc1ee10488ee747a71a8e8ec7a))

## [1.2.0](https://github.com/chartdb/chartdb/compare/v1.1.0...v1.2.0) (2024-11-17)


### Features

* **duplicate table:** duplicate table from the canvas and sidebar ([#404](https://github.com/chartdb/chartdb/issues/404)) ([44cf5ca](https://github.com/chartdb/chartdb/commit/44cf5ca264f52851f2dffb51a752a52b6fa7ec8d))


### Bug Fixes

* **AI exports:** add cahching layer to SQL exports ([#390](https://github.com/chartdb/chartdb/issues/390)) ([e5dbbf2](https://github.com/chartdb/chartdb/commit/e5dbbf2eaab6d80a531d451211b6f5a415bc7ce3))
* **canvas:** fix auto zoom on diagram load ([#395](https://github.com/chartdb/chartdb/issues/395)) ([492c932](https://github.com/chartdb/chartdb/commit/492c9324d27b561470c4967ce2e99f82eec467d8))
* **dockerfile:** support SPA refresh to resolve nginx return 404 ([#384](https://github.com/chartdb/chartdb/issues/384)) ([eaf75ce](https://github.com/chartdb/chartdb/commit/eaf75cedb0e024236c7684bb533856d7f80074da))
* **docs:** update license reference ([#403](https://github.com/chartdb/chartdb/issues/403)) ([44d10c2](https://github.com/chartdb/chartdb/commit/44d10c23907165288951a9d2ec3165ad23f81c61))
* **export image:** Add support for displaying cardinality relationships + background ([#407](https://github.com/chartdb/chartdb/issues/407)) ([68474e7](https://github.com/chartdb/chartdb/commit/68474e75d56ed4b4b445cc9b7f59cca96a4ca5db))
* **i18n:** add Nepali translations ([#406](https://github.com/chartdb/chartdb/issues/406)) ([e1e55c4](https://github.com/chartdb/chartdb/commit/e1e55c4b2ac7755b0810dc1f21da44903fe68a54))
* **i18n:** change language keeps selected language also after refreshing the page ([#409](https://github.com/chartdb/chartdb/issues/409)) ([f35f62f](https://github.com/chartdb/chartdb/commit/f35f62fdf38ca84065f171a31b80aa8123b1d8b9))
* **i18n:** Create Translations in Marathi language ([#266](https://github.com/chartdb/chartdb/issues/266)) ([c6f7ff7](https://github.com/chartdb/chartdb/commit/c6f7ff70f841efb9cf1766338f409fe0ea7bb998))
* **i18n:** fix language nav: close when lang selected, hide tooltip when lang selected ([#411](https://github.com/chartdb/chartdb/issues/411)) ([02aaabd](https://github.com/chartdb/chartdb/commit/02aaabdc4e9b1570d81ff03fe1e6da0307f22999))
* **templates:** add five more templates (Sylius, Monica, Attendize, SaaS Pegasus & BookStack) ([#408](https://github.com/chartdb/chartdb/issues/408)) ([0f67394](https://github.com/chartdb/chartdb/commit/0f673947af469e86f70737427ac8fb3c2420d1a2))
* **templates:** add six more templates (ticketit, snipe-it, refinerycms, comfortable-mexican-sofa, buddypress, lobsters) ([#402](https://github.com/chartdb/chartdb/issues/402)) ([07d3745](https://github.com/chartdb/chartdb/commit/07d374574775d132e1cba0908c47dcbbd6cd2c3f))
* **templates:** fix cloned indexes from a template ([#398](https://github.com/chartdb/chartdb/issues/398)) ([9f8500f](https://github.com/chartdb/chartdb/commit/9f8500fc7e36e6a819ecb9029f263d80eac88279))
* **templates:** fix tags urls ([#405](https://github.com/chartdb/chartdb/issues/405)) ([fe8b9f9](https://github.com/chartdb/chartdb/commit/fe8b9f9e91481d8a3272113b6f4be4da8d61ad04))
* **templates:** tag urls lowercase to support browsers ([#397](https://github.com/chartdb/chartdb/issues/397)) ([959e540](https://github.com/chartdb/chartdb/commit/959e5402b8c112fae6243ce9283947057506c128))

## [1.1.0](https://github.com/chartdb/chartdb/compare/v1.0.1...v1.1.0) (2024-11-13)


### Features

* **add templates:** add five more templates (laravel, django, twitter… ([#371](https://github.com/chartdb/chartdb/issues/371)) ([20b3396](https://github.com/chartdb/chartdb/commit/20b3396ec2afff09ca8bcdd91f5c6284c93cd959))
* **canvas:** Added Snap to grid functionality. Toggle/hold shift to enable snap to grid. ([#373](https://github.com/chartdb/chartdb/issues/373)) ([6c7eb46](https://github.com/chartdb/chartdb/commit/6c7eb4609d8466278de30317665929ec529c1f94))
* **share:** add sharing capabilities to import and export diagrams ([#365](https://github.com/chartdb/chartdb/issues/365)) ([94a5d84](https://github.com/chartdb/chartdb/commit/94a5d84fae819b0de6c1e471d1aad16dc8f39dd6))


### Bug Fixes

* **bundle:** fix bundle size ([#382](https://github.com/chartdb/chartdb/issues/382)) ([4ca1832](https://github.com/chartdb/chartdb/commit/4ca18327324106950f0d1af851b9b74379b67b7b))
* **dockerfile:** support openai key in docker build ([#366](https://github.com/chartdb/chartdb/issues/366)) ([545e857](https://github.com/chartdb/chartdb/commit/545e8578c9e8aa71696f6aa8bec81cacaa602c2d))
* **i18n:** add korean ([#362](https://github.com/chartdb/chartdb/issues/362)) ([b305be8](https://github.com/chartdb/chartdb/commit/b305be82aee00994ef576ca6fd62d72dd491f771))
* **i18n:** Add simplified chinese ([#385](https://github.com/chartdb/chartdb/issues/385)) ([9f28933](https://github.com/chartdb/chartdb/commit/9f2893319a1a2aed9a7c03d15e25a17ab37c2465))
* **i18n:** Added Russian language ([#376](https://github.com/chartdb/chartdb/issues/376)) ([2c69b08](https://github.com/chartdb/chartdb/commit/2c69b08eaea6b86ce0c1ddb18a23e22629198bf5))
* **i18n:** added traditional Chinese language translation ([#356](https://github.com/chartdb/chartdb/issues/356)) ([123f40f](https://github.com/chartdb/chartdb/commit/123f40f39e703ad612635964af530ac72c387d3c))
* **i18n:** Fixed part of RU lang introduced in [#365](https://github.com/chartdb/chartdb/issues/365) feat(share) ([#380](https://github.com/chartdb/chartdb/issues/380)) ([5508c1e](https://github.com/chartdb/chartdb/commit/5508c1e084e0ee24d1a54f721f760b9fc14df107))
* **i18n:** french translation update - share menu ([#391](https://github.com/chartdb/chartdb/issues/391)) ([e3129ce](https://github.com/chartdb/chartdb/commit/e3129cec744d18f09953544d9e74cd5adc4e8afb))
* **import json:** for Check Script Result, default with quotes ([#358](https://github.com/chartdb/chartdb/issues/358)) ([1430d2c](https://github.com/chartdb/chartdb/commit/1430d2c2365b7b74e36b8ff9d32a163d7437448a))
* improve title name edit interaction ([#367](https://github.com/chartdb/chartdb/issues/367)) ([84e7591](https://github.com/chartdb/chartdb/commit/84e7591d0586b9a457f31737c6e363ef41574142))
* **share:** add loader to the export ([#381](https://github.com/chartdb/chartdb/issues/381)) ([3609bfe](https://github.com/chartdb/chartdb/commit/3609bfea4d4c78b03711ff8d721b4e67bf82185a))
* **sql export:** make loading for export interactive ([#388](https://github.com/chartdb/chartdb/issues/388)) ([125a39f](https://github.com/chartdb/chartdb/commit/125a39fb5be803f0e6db0b68fb5bc8e290fa8dae))
* **templates:** change the template url to be database instead of db ([#374](https://github.com/chartdb/chartdb/issues/374)) ([f1d073d](https://github.com/chartdb/chartdb/commit/f1d073d05383955da6f60a9a66ed2be879b103e4))
* **templates:** fix issue with double-clone on localhost ([#394](https://github.com/chartdb/chartdb/issues/394)) ([78c427f](https://github.com/chartdb/chartdb/commit/78c427f38e5c64fc340d13ceb2153c2b85db437e))

## [1.0.1](https://github.com/chartdb/chartdb/compare/v1.0.0...v1.0.1) (2024-11-06)


### Bug Fixes

* **offline:** add support when running on isolated network ([#359](https://github.com/chartdb/chartdb/issues/359)) ([aa884b4](https://github.com/chartdb/chartdb/commit/aa884b49ce16d70f67881bdc940993c1fe901796))
* open default diagram after deleting current diagram ([#350](https://github.com/chartdb/chartdb/issues/350)) ([87a40cf](https://github.com/chartdb/chartdb/commit/87a40cff615b04b678642ba2d6e097c38b26d239))
* **select-box:** allow using tab & space to show choices ([#336](https://github.com/chartdb/chartdb/issues/336)) ([93f623a](https://github.com/chartdb/chartdb/commit/93f623a13a61e9143638fbe7e8346f07e37a26b2))
* **smart query:** import postgres FKs ([#357](https://github.com/chartdb/chartdb/issues/357)) ([acb736e](https://github.com/chartdb/chartdb/commit/acb736e44fd50d29a85b4eff42e20780aef710ed))
* **templates:** add two more templates (Airbnb, Wordpress) ([#317](https://github.com/chartdb/chartdb/issues/317)) ([ebce882](https://github.com/chartdb/chartdb/commit/ebce8827eab049eefa0eebcb0ec2540698bc0e15))
* **templates:** align database icon ([#351](https://github.com/chartdb/chartdb/issues/351)) ([efaddee](https://github.com/chartdb/chartdb/commit/efaddeebb4f24235d82f4e2bf7423fbf48b97187))
* **template:** separator in case of empty url ([#355](https://github.com/chartdb/chartdb/issues/355)) ([180886c](https://github.com/chartdb/chartdb/commit/180886c5882f2329c797fc284b255012d21f5b5c))
* **templates:** fetch templates data from router ([#321](https://github.com/chartdb/chartdb/issues/321)) ([d8a20eb](https://github.com/chartdb/chartdb/commit/d8a20ebbd9118989690a40fcd3aa59fb156b446f))

## 1.0.0 (2024-11-04)


### Features

* ability to change zoom or pan on scroll in the canvas component ([ac208c4](https://github.com/chartdb/chartdb/commit/ac208c47dc307fd0dee5a987bb6ccde8d0599db7))
* add import logic based on the JSON input ([01f4e4b](https://github.com/chartdb/chartdb/commit/01f4e4bc6167c61e9c6b669a10a3f9c84ebc1774))
* add import logic based on the JSON input ([939ac22](https://github.com/chartdb/chartdb/commit/939ac2295f676796b46417433b5ec7625be29839))
* add release ([ac37475](https://github.com/chartdb/chartdb/commit/ac37475f370fb5e11271059aaf25ee98501d4523))
* add release ([80491ae](https://github.com/chartdb/chartdb/commit/80491aea4f9be7b72ced96245607a87b678ead6e))
* Added darkmode support, user and system preferences ([d63700f](https://github.com/chartdb/chartdb/commit/d63700fcfbfc4c65d4a17e93a4b5c48b0c65d9e4))
* added japanese language translation ([#235](https://github.com/chartdb/chartdb/issues/235)) ([588543f](https://github.com/chartdb/chartdb/commit/588543f324bfbec41f1ee67da856b47cc26b1ac2))
* change the menu to activate/deactive zoom on scroll ([a69b241](https://github.com/chartdb/chartdb/commit/a69b241d74f830ebb8f894935c154a53bba93da6))
* disable darkmode toggle until colors are fixed, remove class from create ([e2029da](https://github.com/chartdb/chartdb/commit/e2029da189b2feee772e7d9793ce01e59365f2ca))
* **fetcher:** add pg magic sql ([f74f208](https://github.com/chartdb/chartdb/commit/f74f208a860bf821fd9ace92ffbd91276ef6175c))
* improve dockerfile ([48a0f4f](https://github.com/chartdb/chartdb/commit/48a0f4f240f9fb603a66454e5deb4e7708c6a15d))


### Bug Fixes

* :bug: pk_column changed to column in sqlite ([f85a2d0](https://github.com/chartdb/chartdb/commit/f85a2d086d70e9aa5c63f52a297f290cb2590967))
* add contents permissions ([b896134](https://github.com/chartdb/chartdb/commit/b896134cae940197e6995191dd09124af30ad1a3))
* add permissions ([16a6166](https://github.com/chartdb/chartdb/commit/16a6166b4ad35e879c73ac19a52f8678aad183a8))
* add reference_schema to support again import with FKs ([ce8ef57](https://github.com/chartdb/chartdb/commit/ce8ef57304ab73912275bfbd60e1fee6fe4b104d))
* add reference_schema to support again import with FKs all dbs ([4d34ade](https://github.com/chartdb/chartdb/commit/4d34ade63deb6f4469970ed4fb1f0e4045aa451a))
* add reference_schema to the postgres import script ([48414da](https://github.com/chartdb/chartdb/commit/48414dac83e99d47f2bc195e003689f01602904f))
* add support to MySQL versions below 8.0 ([f2f74ad](https://github.com/chartdb/chartdb/commit/f2f74ad412dfec3a5795182709a949224d37a759))
* autofocus on mobile ([d5cb3e5](https://github.com/chartdb/chartdb/commit/d5cb3e5648203a1552d76818e73c7382b6234f3d))
* change to on push ([866f8f5](https://github.com/chartdb/chartdb/commit/866f8f5ff1aec15a190cad8958d134e9a4ce2a43))
* change to on push ([60f0317](https://github.com/chartdb/chartdb/commit/60f0317ce60c3a8c9dede120e6cfcbbaf4c55174))
* change to on push ([07da6d0](https://github.com/chartdb/chartdb/commit/07da6d05cf9faa809bb9d0f8cd02751f9fb137dc))
* change workflow name ([3770703](https://github.com/chartdb/chartdb/commit/377070391d5573ccaf81ce7bf508bd79393a3d1a))
* change workflow name ([3b4f256](https://github.com/chartdb/chartdb/commit/3b4f2565989247abf88dabd178ad48e188268e33))
* ci ([be04ac2](https://github.com/chartdb/chartdb/commit/be04ac2ff2b2ef17b066bd3a1228408effaa90c4))
* docker login ([de8ca35](https://github.com/chartdb/chartdb/commit/de8ca3580bcfd15ea741a518e78d5e778a8a4ed5))
* **i18n:** add missing German translations ([#311](https://github.com/chartdb/chartdb/issues/311)) ([b2c2045](https://github.com/chartdb/chartdb/commit/b2c20459d55c087f906305707290ac4cfc52055b))
* permissions ([f654418](https://github.com/chartdb/chartdb/commit/f6544186d04bdb54a8afb5489ca62391f8996b1f))
* permissions issue ([e51f4d3](https://github.com/chartdb/chartdb/commit/e51f4d3c1c5471e314c17dc90566e0c8f6e889b9))
* remove cache ([9877dd3](https://github.com/chartdb/chartdb/commit/9877dd3c5a57bfb3e8d3f7efa8e373de3071d217))
* remove cache ([be62368](https://github.com/chartdb/chartdb/commit/be6236877e6005bc326c78fd78529b25e6bec6cb))
* remove effective scroll action ([1c6786b](https://github.com/chartdb/chartdb/commit/1c6786bff44b1be65af814873e40749e37353fa4))
* remove multi platform build ([90fe199](https://github.com/chartdb/chartdb/commit/90fe199b09dd1e46b4b1b29ed9765879bf23c08b))
* remove multi platform build ([21e1a22](https://github.com/chartdb/chartdb/commit/21e1a223bf4fd7d8198ef838801a6c068a26a5ed))
* restrict relationship handle  on views ([a1734eb](https://github.com/chartdb/chartdb/commit/a1734eb376db2642405dc46a4beede8c3f9f79de))
* rounded table node ([21b3c91](https://github.com/chartdb/chartdb/commit/21b3c91d267f0c7f3c9de741365abc23712890a3))
* small update on mobile, add the word Saved ([0a11b6f](https://github.com/chartdb/chartdb/commit/0a11b6f88345126180031ab7359eb941c997c83b))
* support multi schemas when using import script in postgres ([1eff951](https://github.com/chartdb/chartdb/commit/1eff9513eff7c2e52f4752e59ad5afaed52d62eb))
* tag ([2bc8255](https://github.com/chartdb/chartdb/commit/2bc8255c58e0fbec32aeac13e9621e7db690ac7b))
* tag ([00d1792](https://github.com/chartdb/chartdb/commit/00d1792c733335e1c7e82e62cca0e3d3da827a68))
* to support all postgres schemas and not only public ([f203813](https://github.com/chartdb/chartdb/commit/f203813f689e10c5096cdd1a2f4e6b1991c02f33))
* update import queries and fix bug for MySQL & MariaDB ([89e0cdd](https://github.com/chartdb/chartdb/commit/89e0cddd42431ece364301bfb700a140c2df8368))
* uses docker/build-push-action@v5 ([4799d41](https://github.com/chartdb/chartdb/commit/4799d41cd131b8672635aeb71b19a6153b46f4c5))
* uses docker/build-push-action@v5 ([7358c9c](https://github.com/chartdb/chartdb/commit/7358c9c98971896274ffef245ab030897cefea93))
* when import MySQL database via smart query fix PKs import ([dac6059](https://github.com/chartdb/chartdb/commit/dac6059853833d865e0b8a86423b5dac7572e55f))
* zoom in/out on scroll instead of panning ([6a0bc30](https://github.com/chartdb/chartdb/commit/6a0bc30cdbfebed7c12d8ceeba39058d55c170fb))
