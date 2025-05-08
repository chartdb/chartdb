import type { LanguageMetadata } from '../types';

export const en = {
    translation: {
        menu: {
            file: {
                file: 'File',
                new: 'New',
                open: 'Open',
                save: 'Save',
                import: 'Import',
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
                show_dependencies: 'Show Dependencies',
                hide_dependencies: 'Hide Dependencies',
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: 'Backup',
                export_diagram: 'Export Diagram',
                restore_diagram: 'Restore Diagram',
            },
            help: {
                help: 'Help',
                docs_website: 'Docs',
                join_discord: 'Join us on Discord',
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

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Copy failed',
                description: 'Clipboard not supported.',
            },
            failed: {
                title: 'Copy failed',
                description: 'Something went wrong. Please try again.',
            },
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
        loading_diagram: 'Loading diagram...',
        deselect_all: 'Deselect All',
        select_all: 'Select All',
        clear: 'Clear',
        show_more: 'Show More',
        show_less: 'Show Less',
        copy_to_clipboard: 'Copy to Clipboard',
        copied: 'Copied!',

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
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

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
                        character_length: 'Max Length',
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
                        duplicate_table: 'Duplicate Table',
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
            zoom_in: 'Zoom In',
            zoom_out: 'Zoom Out',
            save: 'Save',
            show_all: 'Show All',
            undo: 'Undo',
            redo: 'Redo',
            reorder_diagram: 'Reorder Diagram',
            highlight_overlapping_tables: 'Highlight Overlapping Tables',
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
                step_2: 'Paste the script result into this modal.',
                script_results_placeholder: 'Script results here...',
                ssms_instructions: {
                    button_text: 'SSMS Instructions',
                    title: 'Instructions',
                    step_1: 'Go to Tools > Options > Query Results > SQL Server.',
                    step_2: 'If you\'re using "Results to Grid," change the Maximum Characters Retrieved for Non-XML data (set to 9999999).',
                },
                instructions_link: 'Need help? Watch how',
                check_script_result: 'Check Script Result',
            },

            cancel: 'Cancel',
            import_from_file: 'Import from File',
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

        export_image_dialog: {
            title: 'Export Image',
            description: 'Choose the scale factor for export:',
            scale_1x: '1x Regular',
            scale_2x: '2x (Recommended)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Cancel',
            export: 'Export',
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
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

        import_diagram_dialog: {
            title: 'Import Diagram',
            description: 'Import a diagram from a JSON file.',
            cancel: 'Cancel',
            import: 'Import',
            error: {
                title: 'Error importing diagram',
                description:
                    'The diagram JSON is invalid. Please check the JSON and try again. Need help? support@chartdb.io',
            },
        },

        import_dbml_dialog: {
            example_title: 'Import Example DBML',
            title: 'Import DBML',
            description: 'Import a database schema from DBML format.',
            import: 'Import',
            cancel: 'Cancel',
            skip_and_empty: 'Skip & Empty',
            show_example: 'Show Example',
            error: {
                title: 'Error importing DBML',
                description: 'Failed to parse DBML. Please check the syntax.',
            },
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
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'Edit Table',
            duplicate_table: 'Duplicate Table',
            delete_table: 'Delete Table',
            add_relationship: 'Add Relationship',
        },

        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'Double-click to edit',
        },

        language_select: {
            change_language: 'Language',
        },
    },
};

export const enMetadata: LanguageMetadata = {
    name: 'English',
    nativeName: 'English',
    code: 'en',
};
