import { LanguageMetadata } from '../types';

export const en = {
    translation: {
        menu: {
            file: {
                file: 'File',
                new: 'New',
                open: 'Open',
                save: 'Save',
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
                zoom_on_scroll: 'Zoom on Scroll',
                theme: 'Theme',
                change_language: 'Language',
            },
            help: {
                help: 'Help',
                visit_website: 'Visit ChartDB',
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

        side_panel: {
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
                collapse: 'Collapse All',
                relationship: {
                    primary: 'Primary',
                    foreign: 'Foreign',
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

        relationship_type: {
            one_to_one: 'One to One',
            one_to_many: 'One to Many',
            many_to_one: 'Many to One',
        },
    },
};

export const enMetadata: LanguageMetadata = {
    name: 'English',
    code: 'en',
};
