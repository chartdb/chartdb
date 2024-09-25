import type { LanguageMetadata } from '../types';

export const en = {
    translation: {
        menu: {
            file: {
                file: 'File',
                new: 'New',
                open: 'Open',
                save: 'Save',
                import_database: 'Import Database',
                export_sql: 'Export SQL',
                export_as: 'Export as',
                delete_diagram: 'Delete Diagram',
                exit: 'Exit',
            },
            edit: {
                edit: 'Edit',
                undo: 'Undo',
                redo: 'Redo',
                clear: 'Clear',
            },
            view: {
                view: 'View',
                show_sidebar: 'Show Sidebar',
                hide_sidebar: 'Hide Sidebar',
                hide_cardinality: 'Hide Cardinality',
                show_cardinality: 'Show Cardinality',
                zoom_on_scroll: 'Zoom on Scroll',
                theme: 'Theme',
                change_language: 'Language',
            },
            help: {
                help: 'Help',
                visit_website: 'Visit ChartDB',
                join_discord: 'Join us on Discord',
                schedule_a_call: 'Talk with us!',
            },
        },

        delete_diagram_alert: {
            title: 'Delete Diagram',
            description:
                'This action cannot be undone. This will permanently delete the diagram.',
            cancel: 'Cancel',
            delete: 'Delete',
        },

        clear_diagram_alert: {
            title: 'Clear Diagram',
            description:
                'This action cannot be undone. This will permanently delete all the data in the diagram.',
            cancel: 'Cancel',
            clear: 'Clear',
        },

        reorder_diagram_alert: {
            title: 'Reorder Diagram',
            description:
                'This action will rearrange all tables in the diagram. Do you want to continue?',
            reorder: 'Reorder',
            cancel: 'Cancel',
        },

        multiple_schemas_alert: {
            title: 'Multiple Schemas',
            description:
                '{{schemasCount}} schemas in this diagram. Currently displaying: {{formattedSchemas}}.',
            dont_show_again: "Don't show again",
            change_schema: 'Change',
            none: 'none',
        },

        theme: {
            system: 'System',
            light: 'Light',
            dark: 'Dark',
        },

        zoom: {
            on: 'On',
            off: 'Off',
        },

        last_saved: 'Last saved',
        saved: 'Saved',
        diagrams: 'Diagrams',
        loading_diagram: 'Loading diagram...',
        deselect_all: 'Deselect All',
        select_all: 'Select All',
        clear: 'Clear',
        show_more: 'Show More',
        show_less: 'Show Less',

        side_panel: {
            schema: 'Schema:',
            filter_by_schema: 'Filter by schema',
            search_schema: 'Search schema...',
            no_schemas_found: 'No schemas found.',
            view_all_options: 'View all Options...',
            tables_section: {
                tables: 'Tables',
                add_table: 'Add Table',
                filter: 'Filter',
                collapse: 'Collapse All',

                table: {
                    fields: 'Fields',
                    nullable: 'Nullable?',
                    primary_key: 'Primary Key',
                    indexes: 'Indexes',
                    comments: 'Comments',
                    no_comments: 'No comments',
                    add_field: 'Add Field',
                    add_index: 'Add Index',
                    index_select_fields: 'Select fields',
                    no_types_found: 'No types found',
                    field_name: 'Name',
                    field_type: 'Type',
                    field_actions: {
                        title: 'Field Attributes',
                        unique: 'Unique',
                        comments: 'Comments',
                        no_comments: 'No comments',
                        delete_field: 'Delete Field',
                    },
                    index_actions: {
                        title: 'Index Attributes',
                        name: 'Name',
                        unique: 'Unique',
                        delete_index: 'Delete Index',
                    },
                    table_actions: {
                        title: 'Table Actions',
                        change_schema: 'Change Schema',
                        add_field: 'Add Field',
                        add_index: 'Add Index',
                        delete_table: 'Delete Table',
                    },
                },
                empty_state: {
                    title: 'No tables',
                    description: 'Create a table to get started',
                },
            },
            relationships_section: {
                relationships: 'Relationships',
                filter: 'Filter',
                add_relationship: 'Add Relationship',
                collapse: 'Collapse All',
                relationship: {
                    primary: 'Primary Table',
                    foreign: 'Referenced Table',
                    cardinality: 'Cardinality',
                    delete_relationship: 'Delete',
                    relationship_actions: {
                        title: 'Actions',
                        delete_relationship: 'Delete',
                    },
                },
                empty_state: {
                    title: 'No relationships',
                    description: 'Create a relationship to connect tables',
                },
            },
        },

        toolbar: {
            zoom_in: 'Zoom In',
            zoom_out: 'Zoom Out',
            save: 'Save',
            show_all: 'Show All',
            undo: 'Undo',
            redo: 'Redo',
            reorder_diagram: 'Reorder Diagram',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'What is your Database?',
                description:
                    'Each database has its own unique features and capabilities.',
                check_examples_long: 'Check Examples',
                check_examples_short: 'Examples',
            },

            import_database: {
                title: 'Import your Database',
                database_edition: 'Database Edition:',
                step_1: 'Run this script in your database:',
                step_2: 'Paste the script result here:',
                script_results_placeholder: 'Script results here...',
                ssms_instructions: {
                    button_text: 'SSMS Instructions',
                    title: 'Instructions',
                    step_1: 'Go to Tools > Options > Query Results > SQL Server.',
                    step_2: 'If you\'re using "Results to Grid," change the Maximum Characters Retrieved for Non-XML data (set to 9999999).',
                },
            },

            cancel: 'Cancel',
            back: 'Back',
            empty_diagram: 'Empty diagram',
            continue: 'Continue',
            import: 'Import',
        },

        open_diagram_dialog: {
            title: 'Open Diagram',
            description: 'Select a diagram to open from the list below.',
            table_columns: {
                name: 'Name',
                created_at: 'Created at',
                last_modified: 'Last modified',
                tables_count: 'Tables',
            },
            cancel: 'Cancel',
            open: 'Open',
        },

        export_sql_dialog: {
            title: 'Export SQL',
            description:
                'Export your diagram schema to {{databaseType}} script',
            close: 'Close',
            loading: {
                text: 'AI is generating SQL for {{databaseType}}...',
                description: 'This should take up to 30 seconds.',
            },
            error: {
                message:
                    'Error generating SQL script. Please try again later or <0>contact us</0>.',
                description:
                    'Feel free to use your OPENAI_TOKEN, see the manual <0>here</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Create Relationship',
            primary_table: 'Primary Table',
            primary_field: 'Primary Field',
            referenced_table: 'Referenced Table',
            referenced_field: 'Referenced Field',
            primary_table_placeholder: 'Select table',
            primary_field_placeholder: 'Select field',
            referenced_table_placeholder: 'Select table',
            referenced_field_placeholder: 'Select field',
            no_tables_found: 'No tables found',
            no_fields_found: 'No fields found',
            create: 'Create',
            cancel: 'Cancel',
        },

        import_database_dialog: {
            title: 'Import to Current Diagram',
            override_alert: {
                title: 'Import Database',
                content: {
                    alert: 'Importing this diagram will affect existing tables and relationships.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> new tables will be added.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> new relationships will be created.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> tables will be overwritten.',
                    proceed: 'Do you want to proceed?',
                },
                import: 'Import',
                cancel: 'Cancel',
            },
        },

        new_table_schema_dialog: {
            title: 'Select Schema',
            description:
                'Multiple schemas are currently displayed. Select one for the new table.',
            cancel: 'Cancel',
            confirm: 'Confirm',
        },

        update_table_schema_dialog: {
            title: 'Change Schema',
            description: 'Update table "{{tableName}}" schema',
            cancel: 'Cancel',
            confirm: 'Change',
        },

        star_us_dialog: {
            title: 'Help us improve!',
            description:
                "Would you like to star us on GitHub? It's just a click away!",
            close: 'Not now',
            confirm: 'Of course!',
        },

        relationship_type: {
            one_to_one: 'One to One',
            one_to_many: 'One to Many',
            many_to_one: 'Many to One',
            many_to_many: 'Many to Many',
        },

        canvas_context_menu: {
            new_table: 'New Table',
            new_relationship: 'New Relationship',
        },

        table_node_context_menu: {
            edit_table: 'Edit Table',
            delete_table: 'Delete Table',
        },

        export_high_res: {
            title: 'Export High Resolution Image',
            description: 'Choose the scale factor for export:',
            select_scale: 'Select scale',
            scale_1x: '1x Regular',
            scale_2x: '2x (Recommended)',
            scale_3x: '3x',
            scale_4x: '4x',
            export_png: 'Export High-Res PNG',
            export_jpg: 'Export High-Res JPG',
        },
    },
};

export const enMetadata: LanguageMetadata = {
    name: 'English',
    code: 'en',
};
