import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ch: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: '文件',
                new: '新建',
                open: '打开',
                save: '保存',
                import_database: '导入数据库',
                export_sql: '导出SQL',
                export_as: '导出为...',
                delete_diagram: '删除图表',
                exit: '退出',
            },
            edit: {
                edit: '编辑',
                undo: '撤销',
                redo: '重做',
                clear: '清除',
            },
            view: {
                view: '视图',
                show_sidebar: '显示侧边栏',
                hide_sidebar: '隐藏侧边栏',
                hide_cardinality: '隐藏基数',
                show_cardinality: '显示基数',
                zoom_on_scroll: '滚动缩放',
                theme: '主题',
                change_language: '更改语言',
                show_dependencies: '显示依赖关系',
                hide_dependencies: '隐藏依赖关系',
            },
            help: {
                help: '帮助',
                visit_website: '访问 ChartDB 网站',
                join_discord: '加入 Discord',
                schedule_a_call: '安排通话',
            },
        },

        delete_diagram_alert: {
            title: '删除图表',
            description: '此操作无法撤销。将永久删除图表。',
            cancel: '取消',
            delete: '删除',
        },

        clear_diagram_alert: {
            title: '清除图表',
            description: '此操作无法撤销。将永久删除图表中的所有数据。',
            cancel: '取消',
            clear: '清除',
        },

        reorder_diagram_alert: {
            title: '重新排序图表',
            description: '此操作将重新排列图表中的所有表格。继续吗？',
            reorder: '重新排序',
            cancel: '取消',
        },

        multiple_schemas_alert: {
            title: '多个模式',
            description: '该图表包含{{schemasCount}}个模式。当前显示: {{formattedSchemas}}。',
            dont_show_again: '不再显示',
            change_schema: '更改',
            none: '无',
        },

        theme: {
            system: '系统',
            light: '浅色',
            dark: '深色',
        },

        zoom: {
            on: '开',
            off: '关',
        },

        last_saved: '上次保存',
        saved: '已保存',
        diagrams: '图表',
        loading_diagram: '正在加载图表...',
        deselect_all: '取消全选',
        select_all: '全选',
        clear: '清除',
        show_more: '显示更多',
        show_less: '显示更少',

        side_panel: {
            schema: '模式:',
            filter_by_schema: '按模式过滤',
            search_schema: '搜索模式...',
            no_schemas_found: '未找到模式。',
            view_all_options: '查看所有选项...',
            tables_section: {
                tables: '表格',
                add_table: '添加表格',
                filter: '过滤',
                collapse: '全部折叠',

                table: {
                    fields: '字段',
                    nullable: '允许 NULL?',
                    primary_key: '主键',
                    indexes: '索引',
                    comments: '评论',
                    no_comments: '无评论',
                    add_field: '添加字段',
                    add_index: '添加索引',
                    index_select_fields: '选择字段',
                    no_types_found: '未找到类型',
                    field_name: '名称',
                    field_type: '类型',
                    field_actions: {
                        title: '字段属性',
                        unique: '唯一',
                        comments: '评论',
                        no_comments: '无评论',
                        delete_field: '删除字段',
                    },
                    index_actions: {
                        title: '索引属性',
                        name: '名称',
                        unique: '唯一',
                        delete_index: '删除索引',
                    },
                    table_actions: {
                        title: '表格操作',
                        change_schema: '更改模式',
                        add_field: '添加字段',
                        add_index: '添加索引',
                        delete_table: '删除表格',
                    },
                },
                empty_state: {
                    title: '没有表格',
                    description: '创建表格以开始',
                },
            },
            relationships_section: {
                relationships: '关系',
                filter: '过滤',
                add_relationship: '添加关系',
                collapse: '全部折叠',
                relationship: {
                    primary: '主表',
                    foreign: '外键表',
                    cardinality: '基数',
                    delete_relationship: '删除',
                    relationship_actions: {
                        title: '操作',
                        delete_relationship: '删除',
                    },
                },
                empty_state: {
                    title: '没有关系',
                    description: '创建关系以连接表格',
                },
            },
            dependencies_section: {
                dependencies: '依赖关系',
                filter: '过滤',
                collapse: '全部折叠',
                dependency: {
                    table: '表格',
                    dependent_table: '依赖视图',
                    delete_dependency: '删除',
                    dependency_actions: {
                        title: '操作',
                        delete_dependency: '删除',
                    },
                },
                empty_state: {
                    title: '没有依赖关系',
                    description: '创建视图以开始',
                },
            },
        },

        toolbar: {
            zoom_in: '放大',
            zoom_out: '缩小',
            save: '保存',
            show_all: '显示全部',
            undo: '撤销',
            redo: '重做',
            reorder_diagram: '重新排序图表',
            highlight_overlapping_tables: '高亮重叠表格',
        },

        new_diagram_dialog: {
            database_selection: {
                title: '数据库是什么？',
                description: '每个数据库都有其独特的功能和能力。',
                check_examples_long: '查看示例',
                check_examples_short: '示例',
            },

            import_database: {
                title: '导入数据库',
                database_edition: '数据库版本:',
                step_1: '请在数据库中运行此脚本:',
                step_2: '将脚本结果粘贴在此处:',
                script_results_placeholder: '在此处粘贴脚本结果...',
                ssms_instructions: {
                    button_text: 'SSMS 指南',
                    title: '指南',
                    step_1: '转到 工具 > 选项 > 查询结果 > SQL Server。',
                    step_2: '如果使用“结果到网格”，请更改非 XML 数据的最大检索字符数（设置为 9999999）。',
                },
            },

            cancel: '取消',
            back: '返回',
            empty_diagram: '空图表',
            continue: '继续',
            import: '导入',
        },

        open_diagram_dialog: {
            title: '打开图表',
            description: '请选择一个图表。',
            table_columns: {
                name: '名称',
                created_at: '创建时间',
                last_modified: '最后修改时间',
                tables_count: '表格数量',
            },
            cancel: '取消',
            open: '打开',
        },

        export_sql_dialog: {
            title: '导出 SQL',
            description: '将图表架构导出为 {{databaseType}} 脚本',
            close: '关闭',
            loading: {
                text: 'AI 正在生成 {{databaseType}} 的 SQL...',
                description: '最多需要 30 秒。',
            },
            error: {
                message: '生成 SQL 脚本时出错。请稍后重试或 <0>联系我们</0>。',
                description: '可以自由使用 OPENAI_TOKEN，并通过<0>手册</0>查阅更多信息。',
            },
        },

        create_relationship_dialog: {
            title: '创建关系',
            primary_table: '主表',
            primary_field: '主字段',
            referenced_table: '引用表',
            referenced_field: '引用字段',
            primary_table_placeholder: '选择表格',
            primary_field_placeholder: '选择字段',
            referenced_table_placeholder: '选择表格',
            referenced_field_placeholder: '选择字段',
            no_tables_found: '未找到表格',
            no_fields_found: '未找到字段',
            create: '创建',
            cancel: '取消',
        },

        import_database_dialog: {
            title: '导入到当前图表',
            override_alert: {
                title: '导入数据库',
                content: {
                    alert: '导入此图表将影响现有的表格和关系。',
                    new_tables: '<bold>{{newTablesNumber}}</bold> 个新表格将被添加。',
                    new_relationships: '<bold>{{newRelationshipsNumber}}</bold> 个新关系将被创建。',
                    tables_override: '<bold>{{tablesOverrideNumber}}</bold> 个表格将被覆盖。',
                    proceed: '继续吗？',
                },
                import: '导入',
                cancel: '取消',
            },
        },
           
        export_image_dialog: {
            title: '导出图像',
            description: '请选择导出的倍率:',
            scale_1x: '1x 标准',
            scale_2x: '2x (推荐)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: '取消',
            export: '导出',
        },
        
        new_table_schema_dialog: {
            title: '选择模式',
            description:
                '当前显示多个模式。请选择一个用于新表的模式。',
            cancel: '取消',
            confirm: '确认',
        },
        
        update_table_schema_dialog: {
            title: '更改模式',
            description: '更新表格「{{tableName}}」的模式',
            cancel: '取消',
            confirm: '更改',
        },
        
        star_us_dialog: {
            title: '帮助我们改进！',
            description:
                '能否在 GitHub 上给我们加星？只需点击一下！',
            close: '暂时不加',
            confirm: '当然！',
        },
        
        relationship_type: {
            one_to_one: '一对一',
            one_to_many: '一对多',
            many_to_one: '多对一',
            many_to_many: '多对多',
        },
        
        canvas_context_menu: {
            new_table: '新建表格',
            new_relationship: '新建关系',
        },
        
        table_node_context_menu: {
            edit_table: '编辑表格',
            delete_table: '删除表格',
        },
    },
            
};


export const chMetadata: LanguageMetadata = {
    name: 'Chinese',
    code: 'ch',
};
