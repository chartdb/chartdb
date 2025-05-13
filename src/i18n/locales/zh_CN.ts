import type { LanguageMetadata, LanguageTranslation } from '../types';

export const zh_CN: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: '文件',
                new: '新建',
                open: '打开',
                save: '保存',
                import: '导入数据库',
                export_sql: '导出 SQL 语句',
                export_as: '导出为',
                delete_diagram: '删除关系图',
                exit: '退出',
            },
            edit: {
                edit: '编辑',
                undo: '撤销',
                redo: '重做',
                clear: '清空',
            },
            view: {
                view: '视图',
                show_sidebar: '展示侧边栏',
                hide_sidebar: '隐藏侧边栏',
                hide_cardinality: '隐藏基数',
                show_cardinality: '展示基数',
                zoom_on_scroll: '滚动缩放',
                theme: '主题',
                show_dependencies: '展示依赖',
                hide_dependencies: '隐藏依赖',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: '备份',
                export_diagram: '导出关系图',
                restore_diagram: '还原图表',
            },
            help: {
                help: '帮助',
                docs_website: '文档',
                join_discord: '在 Discord 上加入我们',
            },
        },

        delete_diagram_alert: {
            title: '删除关系图',
            description: '此操作无法撤销。这将永久删除关系图。',
            cancel: '取消',
            delete: '删除',
        },

        clear_diagram_alert: {
            title: '清除关系图',
            description: '此操作无法撤销。这将永久删除关系图中的所有数据。',
            cancel: '取消',
            clear: '清空',
        },

        reorder_diagram_alert: {
            title: '重新排列关系图',
            description: '此操作将重新排列关系图中的所有表。是否要继续？',
            reorder: '重新排列',
            cancel: '取消',
        },

        multiple_schemas_alert: {
            title: '多个模式',
            description:
                '此关系图中有 {{schemasCount}} 个模式，当前显示：{{formattedSchemas}}。',
            dont_show_again: '不再展示',
            change_schema: '更改',
            none: '无',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: '复制失败',
                description: '不支持剪贴板',
            },
            failed: {
                title: '复制失败',
                description: '出现问题。请再试一次。',
            },
        },

        theme: {
            system: '系统',
            light: '浅色',
            dark: '深色',
        },

        zoom: {
            on: '启用',
            off: '禁用',
        },

        last_saved: '上次保存时间：',
        saved: '已保存',
        loading_diagram: '加载关系图...',
        deselect_all: '取消全选',
        select_all: '全选',
        clear: '清空',
        show_more: '展开',
        show_less: '收起',
        copy_to_clipboard: '复制到剪切板',
        copied: '复制了！',

        side_panel: {
            schema: '模式：',
            filter_by_schema: '按模式筛选',
            search_schema: '搜索模式...',
            no_schemas_found: '未找到模式。',
            view_all_options: '查看所有选项...',
            tables_section: {
                tables: '表',
                add_table: '添加表',
                filter: '筛选',
                collapse: '全部折叠',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: '字段',
                    nullable: '可为空？',
                    primary_key: '主键',
                    indexes: '索引',
                    comments: '注释',
                    no_comments: '空',
                    add_field: '添加字段',
                    add_index: '添加索引',
                    index_select_fields: '选择字段',
                    no_types_found: '未找到类型',
                    field_name: '名称',
                    field_type: '类型',
                    field_actions: {
                        title: '字段属性',
                        unique: '唯一',
                        comments: '注释',
                        no_comments: '空',
                        delete_field: '删除字段',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: '索引属性',
                        name: '名称',
                        unique: '唯一',
                        delete_index: '删除索引',
                    },
                    table_actions: {
                        title: '表操作',
                        change_schema: '更改模式',
                        add_field: '添加字段',
                        add_index: '添加索引',
                        duplicate_table: 'Duplicate Table', // TODO: Translate
                        delete_table: '删除表',
                    },
                },
                empty_state: {
                    title: '没有表',
                    description: '新建表以开始',
                },
            },
            relationships_section: {
                relationships: '关系',
                filter: '筛选',
                add_relationship: '添加关系',
                collapse: '全部折叠',
                relationship: {
                    primary: '主表',
                    foreign: '被引用表',
                    cardinality: '基数',
                    delete_relationship: '删除',
                    relationship_actions: {
                        title: '操作',
                        delete_relationship: '删除',
                    },
                },
                empty_state: {
                    title: '无关系',
                    description: '创建关系以连接表',
                },
            },
            dependencies_section: {
                dependencies: '依赖关系',
                filter: '筛选',
                collapse: '全部折叠',
                dependency: {
                    table: '表',
                    dependent_table: '依赖视图',
                    delete_dependency: '删除',
                    dependency_actions: {
                        title: '操作',
                        delete_dependency: '删除',
                    },
                },
                empty_state: {
                    title: '无依赖',
                    description: '创建视图以开始',
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
            zoom_in: '放大',
            zoom_out: '缩小',
            save: '保存',
            show_all: '展示全部',
            undo: '撤销',
            redo: '重做',
            reorder_diagram: '重新排列关系图',
            highlight_overlapping_tables: '突出显示重叠的表',
        },

        new_diagram_dialog: {
            database_selection: {
                title: '您是哪种数据库？',
                description: '每种数据库都有其特性和功能。',
                check_examples_long: '查看样例',
                check_examples_short: '样例',
            },

            import_database: {
                title: '导入您的数据库',
                database_edition: '数据库类型：',
                step_1: '在您的数据库中执行以下脚本：',
                step_2: '将结果粘贴于此：',
                script_results_placeholder: '结果...',
                ssms_instructions: {
                    button_text: 'SSMS 说明',
                    title: '说明',
                    step_1: '前往 工具 > 选项 > 查询结果 > SQL Server。',
                    // TODO: Add translations
                    step_2: '如果您使用“Result to Grid”功能，请将非 XML 数据的最大提取字符数更改为 9999999。',
                },
                instructions_link: '需要帮助？看看如何操作',
                check_script_result: '检查脚本结果',
            },

            cancel: '取消',
            import_from_file: '从文件导入',
            back: '上一步',
            empty_diagram: '新建空关系图',
            continue: '下一步',
            import: '导入',
        },

        open_diagram_dialog: {
            title: '打开关系图',
            description: '从下面的列表中选择一个图表打开。',
            table_columns: {
                name: '名称',
                created_at: '创建于',
                last_modified: '最后修改于',
                tables_count: '表数量',
            },
            cancel: '取消',
            open: '打开',
        },

        export_sql_dialog: {
            title: '导出 SQL 语句',
            description: '将您的图表模式导出为 {{databaseType}} 脚本。',
            close: '关闭',
            loading: {
                text: 'AI 正在为 {{databaseType}} 生成 SQL 语句...',
                description: '此操作最多需要 30 秒。',
            },
            error: {
                message:
                    '生成 SQL 脚本时出错。请稍后再试，或者 <0>联系我们</0>。',
                description:
                    '随时使用您的 OPENAI_TOKEN，在<0>这里</0>查看手册。',
            },
        },

        create_relationship_dialog: {
            title: '创建关系',
            primary_table: '主表',
            primary_field: '主键字段',
            referenced_table: '被引用表',
            referenced_field: '被引用字段',
            primary_table_placeholder: '选择表',
            primary_field_placeholder: '选择字段',
            referenced_table_placeholder: '选择表',
            referenced_field_placeholder: '选择字段',
            no_tables_found: '未找到表',
            no_fields_found: '未找到字段',
            create: '创建',
            cancel: '取消',
        },

        import_database_dialog: {
            title: '导入到当前关系图',
            override_alert: {
                title: '导入数据库',
                content: {
                    alert: '导入此关系图将影响现有的表和关系。',
                    new_tables:
                        '将添加 <bold>{{newTablesNumber}}</bold> 个新表。',
                    new_relationships:
                        '将创建 <bold>{{newRelationshipsNumber}}</bold> 个新关系。',
                    tables_override:
                        '将覆盖 <bold>{{tablesOverrideNumber}}</bold> 个表。',
                    proceed: '您是否要继续操作？',
                },
                import: '导入',
                cancel: '取消',
            },
        },

        export_image_dialog: {
            title: '导出图片',
            description: '选择导出的缩放比例：',
            scale_1x: '1x 常规',
            scale_2x: '2x （推荐）',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: '取消',
            export: '导出',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: '选择模式',
            description: '当前显示多个模式。请选择一个用于新表。',
            cancel: '取消',
            confirm: '确认',
        },

        update_table_schema_dialog: {
            title: '更改模式',
            description: '更新表 "{{tableName}}" 的模式。',
            cancel: '取消',
            confirm: '更改',
        },

        star_us_dialog: {
            title: '帮助我们改进！',
            description: '您想在 GitHub 上为我们加注星标吗？只需点击一下即可！',
            close: '以后再说',
            confirm: '当然！',
        },
        export_diagram_dialog: {
            title: '导出关系图',
            description: '选择导出格式：',
            format_json: 'JSON',
            cancel: '取消',
            export: '导出',
            // TODO: translate
            error: {
                title: 'Error exporting diagram',
                description:
                    'Something went wrong. Need help? support@chartdb.io',
            },
        },

        import_diagram_dialog: {
            title: '导入关系图',
            description: '在下方粘贴关系图的 JSON：',
            cancel: '取消',
            import: '导入',
            error: {
                title: '导入关系图时出错',
                description:
                    '关系图 JSON 无效，请检查 JSON 后重试。需要帮助？ 联系 support@chartdb.io',
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
            one_to_one: '一对一',
            one_to_many: '一对多',
            many_to_one: '多对一',
            many_to_many: '多对多',
        },

        canvas_context_menu: {
            new_table: '新建表',
            new_relationship: '新建关系',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: '编辑表',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: '删除表',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: '对齐到网格（按住 {{key}}）',

        tool_tips: {
            double_click_to_edit: '双击编辑',
        },

        language_select: {
            change_language: '语言',
        },
    },
};

export const zh_CNMetadata: LanguageMetadata = {
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    code: 'zh_CN',
};
