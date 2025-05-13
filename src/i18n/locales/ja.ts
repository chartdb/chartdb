import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ja: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'ファイル',
                new: '新規',
                open: '開く',
                save: '保存',
                import: 'データベースをインポート',
                export_sql: 'SQLをエクスポート',
                export_as: '形式を指定してエクスポート',
                delete_diagram: 'ダイアグラムを削除',
                exit: '終了',
            },
            edit: {
                edit: '編集',
                undo: '元に戻す',
                redo: 'やり直し',
                clear: 'クリア',
            },
            view: {
                view: '表示',
                show_sidebar: 'サイドバーを表示',
                hide_sidebar: 'サイドバーを非表示',
                hide_cardinality: 'カーディナリティを非表示',
                show_cardinality: 'カーディナリティを表示',
                zoom_on_scroll: 'スクロールでズーム',
                theme: 'テーマ',
                // TODO: Translate
                show_dependencies: 'Show Dependencies',
                hide_dependencies: 'Hide Dependencies',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            // TODO: Translate
            backup: {
                backup: 'Backup',
                export_diagram: 'Export Diagram',
                restore_diagram: 'Restore Diagram',
            },
            help: {
                help: 'ヘルプ',
                docs_website: 'ドキュメント',
                join_discord: 'Discordに参加',
            },
        },

        delete_diagram_alert: {
            title: 'ダイアグラムを削除',
            description:
                'この操作は元に戻せません。これによりダイアグラムが永久に削除されます。',
            cancel: 'キャンセル',
            delete: '削除',
        },

        clear_diagram_alert: {
            title: 'ダイアグラムをクリア',
            description:
                'この操作は元に戻せません。これによりダイアグラム内のすべてのデータが永久に削除されます。',
            cancel: 'キャンセル',
            clear: 'クリア',
        },

        reorder_diagram_alert: {
            title: 'ダイアグラムを並べ替え',
            description:
                'この操作によりダイアグラム内のすべてのテーブルが再配置されます。続行しますか？',
            reorder: '並べ替え',
            cancel: 'キャンセル',
        },

        multiple_schemas_alert: {
            title: '複数のスキーマ',
            description:
                'このダイアグラムには{{schemasCount}}個のスキーマがあります。現在表示中: {{formattedSchemas}}。',
            dont_show_again: '再表示しない',
            change_schema: '変更',
            none: 'なし',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'コピー失敗',
                description: 'クリップボードがサポートされていません',
            },
            failed: {
                title: 'コピー失敗',
                description:
                    '何かがうまくいきませんでした。もう一度お試しください。',
            },
        },

        theme: {
            system: 'システム',
            light: 'ライト',
            dark: 'ダーク',
        },

        zoom: {
            on: 'オン',
            off: 'オフ',
        },

        last_saved: '最後に保存された',
        saved: '保存されました',
        loading_diagram: 'ダイアグラムを読み込み中...',
        deselect_all: 'すべての選択を解除',
        select_all: 'すべてを選択',
        clear: 'クリア',
        show_more: 'さらに表示',
        show_less: '表示を減らす',
        // TODO: Translate
        copy_to_clipboard: 'Copy to Clipboard',
        copied: 'Copied!',

        side_panel: {
            schema: 'スキーマ:',
            filter_by_schema: 'スキーマでフィルタ',
            search_schema: 'スキーマを検索...',
            no_schemas_found: 'スキーマが見つかりません。',
            view_all_options: 'すべてのオプションを表示...',
            tables_section: {
                tables: 'テーブル',
                add_table: 'テーブルを追加',
                filter: 'フィルタ',
                collapse: 'すべて折りたたむ',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'フィールド',
                    nullable: 'NULL可能?',
                    primary_key: '主キー',
                    indexes: 'インデックス',
                    comments: 'コメント',
                    no_comments: 'コメントがありません',
                    add_field: 'フィールドを追加',
                    add_index: 'インデックスを追加',
                    index_select_fields: 'フィールドを選択',
                    no_types_found: 'タイプが見つかりません',
                    field_name: '名前',
                    field_type: 'タイプ',
                    field_actions: {
                        title: 'フィールド属性',
                        unique: 'ユニーク',
                        comments: 'コメント',
                        no_comments: 'コメントがありません',
                        delete_field: 'フィールドを削除',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'インデックス属性',
                        name: '名前',
                        unique: 'ユニーク',
                        delete_index: 'インデックスを削除',
                    },
                    table_actions: {
                        title: 'テーブル操作',
                        change_schema: 'スキーマを変更',
                        add_field: 'フィールドを追加',
                        add_index: 'インデックスを追加',
                        duplicate_table: 'Duplicate Table', // TODO: Translate
                        delete_table: 'テーブルを削除',
                    },
                },
                empty_state: {
                    title: 'テーブルがありません',
                    description: 'テーブルを作成して開始してください',
                },
            },
            relationships_section: {
                relationships: 'リレーションシップ',
                filter: 'フィルタ',
                add_relationship: 'リレーションシップを追加',
                collapse: 'すべて折りたたむ',
                relationship: {
                    primary: '主テーブル',
                    foreign: '参照テーブル',
                    cardinality: 'カーディナリティ',
                    delete_relationship: '削除',
                    relationship_actions: {
                        title: '操作',
                        delete_relationship: '削除',
                    },
                },
                empty_state: {
                    title: 'リレーションシップがありません',
                    description:
                        'テーブルを接続するためにリレーションシップを作成してください',
                },
            },
            // TODO: Translate
            dependencies_section: {
                dependencies: 'Dependencies',
                filter: 'Filter',
                collapse: 'Collapse All',
                dependency: {
                    table: 'Table',
                    dependent_table: 'Dependent View',
                    delete_dependency: 'Delete',
                    dependency_actions: {
                        title: 'Actions',
                        delete_dependency: 'Delete',
                    },
                },
                empty_state: {
                    title: 'No dependencies',
                    description: 'Create a view to get started',
                },
            },

            // TODO: Translate
            areas_section: {
                areas: 'Areas',
                add_area: 'Add Area',
                filter: 'Filter',
                clear: 'Clear Filter',
                no_results: 'No areas found matching your filter.',

                area: {
                    area_actions: {
                        title: 'Area Actions',
                        edit_name: 'Edit Name',
                        delete_area: 'Delete Area',
                    },
                },
                empty_state: {
                    title: 'No areas',
                    description: 'Create an area to get started',
                },
            },
        },

        toolbar: {
            zoom_in: 'ズームイン',
            zoom_out: 'ズームアウト',
            save: '保存',
            show_all: 'すべて表示',
            undo: '元に戻す',
            redo: 'やり直し',
            reorder_diagram: 'ダイアグラムを並べ替え',
            // TODO: Translate
            highlight_overlapping_tables: 'Highlight Overlapping Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'データベースは何ですか？',
                description: '各データベースには独自の機能と能力があります。',
                check_examples_long: '例を確認',
                check_examples_short: '例',
            },

            import_database: {
                title: 'データベースをインポート',
                database_edition: 'データベースエディション:',
                step_1: 'このスクリプトをデータベースで実行してください:',
                step_2: 'ここにスクリプトの結果を貼り付けてください:',
                script_results_placeholder: 'ここにスクリプトの結果...',
                ssms_instructions: {
                    button_text: 'SSMSの手順',
                    title: '手順',
                    step_1: 'ツール > オプション > クエリ結果 > SQL Serverに移動します。',
                    step_2: '「グリッドへの結果」を使用している場合、XML以外のデータの最大取得文字数を変更してください（9999999に設定）。',
                },
                // TODO: Translate
                instructions_link: 'Need help? Watch how',
                check_script_result: 'Check Script Result',
            },

            cancel: 'キャンセル',
            back: '戻る',
            // TODO: Translate
            import_from_file: 'Import from File',
            empty_diagram: '空のダイアグラム',
            continue: '続行',
            import: 'インポート',
        },

        open_diagram_dialog: {
            title: 'ダイアグラムを開く',
            description: '以下のリストからダイアグラムを選択してください。',
            table_columns: {
                name: '名前',
                created_at: '作成日',
                last_modified: '最終更新日',
                tables_count: 'テーブル数',
            },
            cancel: 'キャンセル',
            open: '開く',
        },

        export_sql_dialog: {
            title: 'SQLをエクスポート',
            description:
                'ダイアグラムスキーマを{{databaseType}}スクリプトにエクスポート',
            close: '閉じる',
            loading: {
                text: 'AIが{{databaseType}}のSQLを生成中...',
                description: 'これには最大30秒かかります。',
            },
            error: {
                message:
                    'SQLスクリプトの生成中にエラーが発生しました。後でもう一度試すか、<0>お問い合わせください</0>。',
                description:
                    'OPENAI_TOKENを自由に使用して、マニュアルを<0>こちら</0>で確認してください。',
            },
        },

        create_relationship_dialog: {
            title: 'リレーションシップを作成',
            primary_table: '主テーブル',
            primary_field: '主フィールド',
            referenced_table: '参照テーブル',
            referenced_field: '参照フィールド',
            primary_table_placeholder: 'テーブルを選択',
            primary_field_placeholder: 'フィールドを選択',
            referenced_table_placeholder: 'テーブルを選択',
            referenced_field_placeholder: 'フィールドを選択',
            no_tables_found: 'テーブルが見つかりません',
            no_fields_found: 'フィールドが見つかりません',
            create: '作成',
            cancel: 'キャンセル',
        },

        import_database_dialog: {
            title: '現在のダイアグラムにインポート',
            override_alert: {
                title: 'データベースをインポート',
                content: {
                    alert: 'このダイアグラムをインポートすると、既存のテーブルおよびリレーションシップに影響を与えます。',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> 新しいテーブルが追加されます。',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> 新しいリレーションシップが作成されます。',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> テーブルが上書きされます。',
                    proceed: '続行しますか？',
                },
                import: 'インポート',
                cancel: 'キャンセル',
            },
        },

        export_image_dialog: {
            title: '画像をエクスポート',
            description: 'エクスポートの倍率を選択してください:',
            scale_1x: '1x 標準',
            scale_2x: '2x (推奨)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'キャンセル',
            export: 'エクスポート',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'スキーマを選択',
            description:
                '現在、複数のスキーマが表示されています。新しいテーブル用に1つを選択してください。',
            cancel: 'キャンセル',
            confirm: '確認',
        },

        update_table_schema_dialog: {
            title: 'スキーマを変更',
            description: 'テーブル「{{tableName}}」のスキーマを更新',
            cancel: 'キャンセル',
            confirm: '変更',
        },

        star_us_dialog: {
            title: '改善をサポートしてください！',
            description:
                'GitHubでスターを付けていただけますか？ クリックするだけです！',
            close: '今はしない',
            confirm: 'もちろん！',
        },
        // TODO: Translate
        export_diagram_dialog: {
            title: 'Export Diagram',
            description: 'Choose the format for export:',
            format_json: 'JSON',
            cancel: 'Cancel',
            export: 'Export',
            error: {
                title: 'Error exporting diagram',
                description:
                    'Something went wrong. Need help? support@chartdb.io',
            },
        },
        // TODO: Translate
        import_diagram_dialog: {
            title: 'Import Diagram',
            description: 'Paste the diagram JSON below:',
            cancel: 'Cancel',
            import: 'Import',
            error: {
                title: 'Error importing diagram',
                description:
                    'The diagram JSON is invalid. Please check the JSON and try again. Need help? support@chartdb.io',
            },
        },
        // TODO: Translate
        import_dbml_dialog: {
            example_title: 'Import Example DBML',
            title: 'Import DBML',
            description: 'Import a database schema from DBML format.',
            import: 'Import',
            cancel: 'Cancel',
            skip_and_empty: 'Skip & Empty',
            show_example: 'Show Example',
            error: {
                title: 'Error',
                description: 'Failed to parse DBML. Please check the syntax.',
            },
        },
        relationship_type: {
            one_to_one: '1対1',
            one_to_many: '1対多',
            many_to_one: '多対1',
            many_to_many: '多対多',
        },

        canvas_context_menu: {
            new_table: '新しいテーブル',
            new_relationship: '新しいリレーションシップ',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'テーブルを編集',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: 'テーブルを削除',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'ダブルクリックして編集',
        },

        language_select: {
            change_language: '言語',
        },
    },
};

export const jaMetadata: LanguageMetadata = {
    name: 'Japanese',
    nativeName: '日本語',
    code: 'ja',
};
