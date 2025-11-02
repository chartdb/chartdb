import type { LanguageMetadata, LanguageTranslation } from '../types';

export const zh_TW: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: '新建',
            browse: '瀏覽',
            tables: '表格',
            refs: 'Refs',
            dependencies: '相依性',
            custom_types: '自定義類型',
            visuals: '視覺效果',
        },
        menu: {
            actions: {
                actions: '操作',
                new: '新增...',
                browse: '瀏覽...',
                save: '儲存',
                import: '匯入資料庫',
                export_sql: '匯出 SQL',
                export_as: '匯出為特定格式',
                delete_diagram: '刪除',
            },
            edit: {
                edit: '編輯',
                undo: '復原',
                redo: '重做',
                clear: '清除',
            },
            view: {
                view: '檢視',
                show_sidebar: '顯示側邊欄',
                hide_sidebar: '隱藏側邊欄',
                hide_cardinality: '隱藏基數',
                show_cardinality: '顯示基數',
                hide_field_attributes: '隱藏欄位屬性',
                show_field_attributes: '顯示欄位屬性',
                zoom_on_scroll: '滾動縮放',
                show_views: '資料庫檢視',
                theme: '主題',
                show_dependencies: '顯示相依性',
                hide_dependencies: '隱藏相依性',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: '備份',
                export_diagram: '匯出圖表',
                restore_diagram: '恢復圖表',
            },
            help: {
                help: '幫助',
                docs_website: '文件',
                join_discord: '加入 Discord',
            },
        },

        delete_diagram_alert: {
            title: '刪除圖表',
            description: '此操作無法復原，圖表將被永久刪除。',
            cancel: '取消',
            delete: '刪除',
        },

        clear_diagram_alert: {
            title: '清除圖表',
            description: '此操作無法復原，圖表中的所有資料將被永久刪除。',
            cancel: '取消',
            clear: '清除',
        },

        reorder_diagram_alert: {
            title: '自動排列圖表',
            description: '此操作將重新排列圖表中的所有表格。是否繼續？',
            reorder: '自動排列',
            cancel: '取消',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: '複製失敗',
                description: '不支援剪貼簿',
            },
            failed: {
                title: '複製失敗',
                description: '出現問題。請再試一次。',
            },
        },

        theme: {
            system: '系統',
            light: '淺色',
            dark: '深色',
        },

        zoom: {
            on: '開啟',
            off: '關閉',
        },

        last_saved: '上次儲存於',
        saved: '已儲存',
        loading_diagram: '正在載入圖表...',
        deselect_all: '取消所有選取',
        select_all: '全選',
        clear: '清除',
        show_more: '顯示更多',
        show_less: '顯示較少',
        copy_to_clipboard: '複製到剪貼簿',
        copied: '已複製！',

        side_panel: {
            view_all_options: '顯示所有選項...',
            tables_section: {
                tables: '表格',
                add_table: '新增表格',
                add_view: '新增檢視',
                filter: '篩選',
                collapse: '全部摺疊',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: '欄位',
                    nullable: '可為 NULL?',
                    primary_key: '主鍵',
                    indexes: '索引',
                    comments: '註解',
                    no_comments: '無註解',
                    add_field: '新增欄位',
                    add_index: '新增索引',
                    index_select_fields: '選擇欄位',
                    no_types_found: '未找到類型',
                    field_name: '名稱',
                    field_type: '類型',
                    field_actions: {
                        title: '欄位屬性',
                        unique: '唯一',
                        auto_increment: '自動遞增',
                        comments: '註解',
                        no_comments: '無註解',
                        delete_field: '刪除欄位',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: '精度',
                        scale: '小數位',
                    },
                    index_actions: {
                        title: '索引屬性',
                        name: '名稱',
                        unique: '唯一',
                        index_type: '索引類型',
                        delete_index: '刪除索引',
                    },
                    table_actions: {
                        title: '表格操作',
                        change_schema: '變更 Schema',
                        add_field: '新增欄位',
                        add_index: '新增索引',
                        duplicate_table: 'Duplicate Table', // TODO: Translate
                        delete_table: '刪除表格',
                    },
                },
                empty_state: {
                    title: '尚無表格',
                    description: '請新增表格以開始',
                },
            },
            refs_section: {
                refs: 'Refs',
                filter: '篩選',
                collapse: '全部摺疊',
                add_relationship: '新增關聯',
                relationships: '關聯',
                dependencies: '相依性',
                relationship: {
                    relationship: '關聯',
                    primary: '主表格',
                    foreign: '參照表格',
                    cardinality: '基數',
                    delete_relationship: '刪除',
                    relationship_actions: {
                        title: '操作',
                        delete_relationship: '刪除',
                    },
                },
                dependency: {
                    dependency: '相依性',
                    table: '表格',
                    dependent_table: '相依檢視',
                    delete_dependency: '刪除',
                    dependency_actions: {
                        title: '操作',
                        delete_dependency: '刪除',
                    },
                },
                empty_state: {
                    title: '尚無關聯',
                    description: '請建立關聯以開始',
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
                visuals: '視覺效果',
                tabs: {
                    areas: 'Areas',
                    notes: '筆記',
                },
            },

            notes_section: {
                filter: '篩選',
                add_note: '新增筆記',
                no_results: '未找到筆記',
                clear: '清除篩選',
                empty_state: {
                    title: '沒有筆記',
                    description: '建立筆記以在畫布上新增文字註解',
                },
                note: {
                    empty_note: '空白筆記',
                    note_actions: {
                        title: '筆記操作',
                        edit_content: '編輯內容',
                        delete_note: '刪除筆記',
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
                    no_values: '沒有定義列舉值',
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
            zoom_in: '放大',
            zoom_out: '縮小',
            save: '儲存',
            show_all: '顯示全部',
            undo: '復原',
            redo: '重做',
            reorder_diagram: '自動排列圖表',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: '突出顯示重疊表格',
            // TODO: Translate
            filter: 'Filter Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: '您使用的是哪種資料庫？',
                description: '每種資料庫都有其獨特的功能和能力。',
                check_examples_long: '查看範例',
                check_examples_short: '範例',
            },

            import_database: {
                title: '匯入資料庫',
                database_edition: '資料庫版本:',
                step_1: '請在資料庫中執行以下腳本:',
                step_2: '將腳本結果貼到此處 →',
                script_results_placeholder: '在此處貼上腳本結果...',
                ssms_instructions: {
                    button_text: 'SSMS 操作步驟',
                    title: '操作步驟',
                    step_1: '導航至 工具 > 選項 > 查詢結果 > SQL Server。',
                    step_2: '若使用「結果至網格」，請更改非 XML 資料的最大取得字元數（設定為 9999999）。',
                },
                instructions_link: '需要幫助？觀看教學影片',
                check_script_result: '檢查腳本結果',
            },

            cancel: '取消',
            import_from_file: '從檔案匯入',
            back: '返回',
            empty_diagram: '空資料庫',
            continue: '繼續',
            import: '匯入',
        },

        open_diagram_dialog: {
            title: '開啟資料庫',
            description: '請從以下列表中選擇一個圖表。',
            table_columns: {
                name: '名稱',
                created_at: '創建時間',
                last_modified: '最後修改時間',
                tables_count: '表格數',
            },
            cancel: '取消',
            open: '開啟',

            diagram_actions: {
                open: '開啟',
                duplicate: '複製',
                delete: '刪除',
            },
        },

        export_sql_dialog: {
            title: '匯出 SQL',
            description: '將圖表 Schema 匯出為 {{databaseType}} 格式的腳本',
            close: '關閉',
            loading: {
                text: 'AI 正在生成 {{databaseType}} 的 SQL...',
                description: '最多需要 30 秒。',
            },
            error: {
                message:
                    '生成 SQL 腳本時發生錯誤。稍後再試，或<0>聯繫我們</0>。',
                description:
                    '可以自由使用 OPENAI_TOKEN，詳細說明可參考<0>此處</0>。',
            },
        },

        create_relationship_dialog: {
            title: '新增關聯',
            primary_table: '主表格',
            primary_field: '主欄位',
            referenced_table: '參照表格',
            referenced_field: '參照欄位',
            primary_table_placeholder: '選擇表格',
            primary_field_placeholder: '選擇欄位',
            referenced_table_placeholder: '選擇表格',
            referenced_field_placeholder: '選擇欄位',
            no_tables_found: '未找到表格',
            no_fields_found: '未找到欄位',
            create: '建立',
            cancel: '取消',
        },

        import_database_dialog: {
            title: '匯入至當前圖表',
            override_alert: {
                title: '匯入資料庫',
                content: {
                    alert: '匯入此圖表將影響現有表格和關聯。',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> 個新表格將被新增。',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> 個新關聯將被建立。',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> 個表格將被覆蓋。',
                    proceed: '是否繼續？',
                },
                import: '匯入',
                cancel: '取消',
            },
        },

        export_image_dialog: {
            title: '匯出圖片',
            description: '請選擇匯出的倍率:',
            scale_1x: '1x 標準',
            scale_2x: '2x (推薦)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: '取消',
            export: '匯出',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: '選擇 Schema',
            description: '目前顯示多個 Schema，請為新表格選擇一個。',
            cancel: '取消',
            confirm: '確認',
        },

        update_table_schema_dialog: {
            title: '變更 Schema',
            description: '更新表格「{{tableName}}」的 Schema',
            cancel: '取消',
            confirm: '變更',
        },

        create_table_schema_dialog: {
            title: '建立新 Schema',
            description:
                '尚未存在任何 Schema。建立您的第一個 Schema 來組織您的表格。',
            create: '建立',
            cancel: '取消',
        },

        star_us_dialog: {
            title: '協助我們改善！',
            description: '請在 GitHub 上給我們一顆星，只需點擊一下！',
            close: '先不要',
            confirm: '當然！',
        },
        export_diagram_dialog: {
            title: '匯出圖表',
            description: '選擇匯出格式：',
            format_json: 'JSON',
            cancel: '取消',
            export: '匯出',
            // TODO: Translate
            error: {
                title: 'Error exporting diagram',
                description:
                    'Something went wrong. Need help? support@chartdb.io',
            },
        },

        import_diagram_dialog: {
            title: '匯入圖表',
            description: '請在下方貼上圖表的 JSON：',
            cancel: '取消',
            import: '匯入',
            error: {
                title: '匯入圖表時發生錯誤',
                description:
                    '圖表的 JSON 無效。請檢查 JSON 並再試一次。如需幫助，請聯繫 support@chartdb.io',
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
            one_to_one: '一對一',
            one_to_many: '一對多',
            many_to_one: '多對一',
            many_to_many: '多對多',
        },

        canvas_context_menu: {
            new_table: '新建表格',
            new_view: '新檢視',
            new_relationship: '新建關聯',
            // TODO: Translate
            new_area: 'New Area',
            new_note: '新筆記',
        },

        table_node_context_menu: {
            edit_table: '編輯表格',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: '刪除表格',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: '對齊網格（按住 {{key}}）',

        tool_tips: {
            double_click_to_edit: '雙擊以編輯',
        },

        language_select: {
            change_language: '變更語言',
        },

        on: '開啟',
        off: '關閉',
    },
};

export const zh_TWMetadata: LanguageMetadata = {
    nativeName: '繁體中文',
    name: 'Chinese (Traditional)',
    code: 'zh_TW',
};
