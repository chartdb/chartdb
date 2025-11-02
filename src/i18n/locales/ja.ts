import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ja: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: '新規',
            browse: '参照',
            tables: 'テーブル',
            refs: '参照',
            dependencies: '依存関係',
            custom_types: 'カスタムタイプ',
            visuals: 'ビジュアル',
        },
        menu: {
            actions: {
                actions: 'アクション',
                new: '新規...',
                browse: '参照...',
                save: '保存',
                import: 'データベースをインポート',
                export_sql: 'SQLをエクスポート',
                export_as: '形式を指定してエクスポート',
                delete_diagram: '削除',
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
                hide_field_attributes: 'フィールド属性を非表示',
                show_field_attributes: 'フィールド属性を表示',
                zoom_on_scroll: 'スクロールでズーム',
                show_views: 'データベースビュー',
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
            title: 'ダイアグラムを自動配置',
            description:
                'この操作によりダイアグラム内のすべてのテーブルが再配置されます。続行しますか？',
            reorder: '自動配置',
            cancel: 'キャンセル',
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
            view_all_options: 'すべてのオプションを表示...',
            tables_section: {
                tables: 'テーブル',
                add_table: 'テーブルを追加',
                add_view: 'ビューを追加',
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
                        auto_increment: 'オートインクリメント',
                        comments: 'コメント',
                        no_comments: 'コメントがありません',
                        delete_field: 'フィールドを削除',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: '精度',
                        scale: '小数点以下桁数',
                    },
                    index_actions: {
                        title: 'インデックス属性',
                        name: '名前',
                        unique: 'ユニーク',
                        index_type: 'インデックスタイプ',
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
            refs_section: {
                refs: '参照',
                filter: 'フィルタ',
                collapse: 'すべて折りたたむ',
                add_relationship: 'リレーションシップを追加',
                relationships: 'リレーションシップ',
                dependencies: '依存関係',
                relationship: {
                    relationship: 'リレーションシップ',
                    primary: '主テーブル',
                    foreign: '参照テーブル',
                    cardinality: 'カーディナリティ',
                    delete_relationship: '削除',
                    relationship_actions: {
                        title: '操作',
                        delete_relationship: '削除',
                    },
                },
                dependency: {
                    dependency: '依存関係',
                    table: 'テーブル',
                    dependent_table: '依存ビュー',
                    delete_dependency: '削除',
                    dependency_actions: {
                        title: '操作',
                        delete_dependency: '削除',
                    },
                },
                empty_state: {
                    title: 'リレーションシップがありません',
                    description:
                        '開始するためにリレーションシップを作成してください',
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

            visuals_section: {
                visuals: 'ビジュアル',
                tabs: {
                    areas: 'Areas',
                    notes: 'ノート',
                },
            },

            notes_section: {
                filter: 'フィルター',
                add_note: 'ノートを追加',
                no_results: 'ノートが見つかりません',
                clear: 'フィルターをクリア',
                empty_state: {
                    title: 'ノートがありません',
                    description:
                        'キャンバス上にテキスト注釈を追加するためのノートを作成',
                },
                note: {
                    empty_note: '空のノート',
                    note_actions: {
                        title: 'ノートアクション',
                        edit_content: 'コンテンツを編集',
                        delete_note: 'ノートを削除',
                    },
                },
            },

            // TODO: Translate
            custom_types_section: {
                custom_types: 'Custom Types',
                filter: 'Filter',
                clear: 'Clear Filter',
                no_results: 'No custom types found matching your filter.',
                empty_state: {
                    title: 'No custom types',
                    description:
                        'Custom types will appear here when they are available in your database',
                },
                custom_type: {
                    kind: 'Kind',
                    enum_values: 'Enum Values',
                    composite_fields: 'Fields',
                    no_fields: 'No fields defined',
                    no_values: '列挙値が定義されていません',
                    field_name_placeholder: 'Field name',
                    field_type_placeholder: 'Select type',
                    add_field: 'Add Field',
                    no_fields_tooltip: 'No fields defined for this custom type',
                    custom_type_actions: {
                        title: 'Actions',
                        highlight_fields: 'Highlight Fields',
                        delete_custom_type: 'Delete',
                        clear_field_highlight: 'Clear Highlight',
                    },
                    delete_custom_type: 'Delete Type',
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
            reorder_diagram: 'ダイアグラムを自動配置',
            // TODO: Translate
            highlight_overlapping_tables: 'Highlight Overlapping Tables',
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear', // TODO: Translate
            filter: 'Filter Tables',
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
                step_2: 'ここにスクリプトの結果を貼り付けてください →',
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
            empty_diagram: '空のデータベース',
            continue: '続行',
            import: 'インポート',
        },

        open_diagram_dialog: {
            title: 'データベースを開く',
            description: '以下のリストからダイアグラムを選択してください。',
            table_columns: {
                name: '名前',
                created_at: '作成日',
                last_modified: '最終更新日',
                tables_count: 'テーブル数',
            },
            cancel: 'キャンセル',
            open: '開く',

            diagram_actions: {
                open: '開く',
                duplicate: '複製',
                delete: '削除',
            },
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

        create_table_schema_dialog: {
            title: '新しいスキーマを作成',
            description:
                'スキーマがまだ存在しません。テーブルを整理するために最初のスキーマを作成してください。',
            create: '作成',
            cancel: 'キャンセル',
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
            new_view: '新しいビュー',
            new_relationship: '新しいリレーションシップ',
            // TODO: Translate
            new_area: 'New Area',
            new_note: '新しいメモ',
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

        on: 'オン',
        off: 'オフ',
    },
};

export const jaMetadata: LanguageMetadata = {
    name: 'Japanese',
    nativeName: '日本語',
    code: 'ja',
};
