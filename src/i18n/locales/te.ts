import type { LanguageMetadata, LanguageTranslation } from '../types';

export const te: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'ఫైల్',
                new: 'కొత్తది',
                open: 'తెరవు',
                save: 'సేవ్',
                import: 'డేటాబేస్‌ను దిగుమతి చేసుకోండి',
                export_sql: 'SQL ఎగుమతి',
                export_as: 'వగా ఎగుమతి చేయండి',
                delete_diagram: 'చిత్రాన్ని తొలగించండి',
                exit: 'నిష్క్రమించు',
            },
            edit: {
                edit: 'సవరించు',
                undo: 'తిరిగి చేయు',
                redo: 'మరలా చేయు',
                clear: 'తొలగించు',
            },
            view: {
                view: 'కாணండి',
                show_sidebar: 'సైడ్‌బార్ చూపించు',
                hide_sidebar: 'సైడ్‌బార్ దాచండి',
                hide_cardinality: 'కార్డినాలిటీని దాచండి',
                show_cardinality: 'కార్డినాలిటీని చూపించండి',
                zoom_on_scroll: 'స్క్రోల్‌పై జూమ్',
                theme: 'థీమ్',
                show_dependencies: 'ఆధారాలు చూపించండి',
                hide_dependencies: 'ఆధారాలను దాచండి',
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
                help: 'సహాయం',
                docs_website: 'డాక్యుమెంటేషన్',
                join_discord: 'డిస్కార్డ్‌లో మా నుంచి చేరండి',
            },
        },

        delete_diagram_alert: {
            title: 'చిత్రం తొలగించండి',
            description:
                'ఈ చర్యను తిరిగి చేయలేరు. ఇది చిత్రాన్ని శాశ్వతంగా తొలగిస్తుంది.',
            cancel: 'రద్దు',
            delete: 'తొలగించు',
        },

        clear_diagram_alert: {
            title: 'చిత్రాన్ని తొలగించు',
            description:
                'ఈ చర్యను తిరిగి చేయలేరు. ఇది చిత్రంలో ఉన్న అన్ని డేటాను శాశ్వతంగా తొలగిస్తుంది.',
            cancel: 'రద్దు',
            clear: 'తొలగించు',
        },

        reorder_diagram_alert: {
            title: 'చిత్రాన్ని పునఃసరిచేయండి',
            description:
                'ఈ చర్య చిత్రంలోని అన్ని పట్టికలను పునఃస్థాపిస్తుంది. మీరు కొనసాగించాలనుకుంటున్నారా?',
            reorder: 'పునఃసరిచేయండి',
            cancel: 'రద్దు',
        },

        multiple_schemas_alert: {
            title: 'బహుళ స్కీమాలు',
            description:
                '{{schemasCount}} స్కీమాలు ఈ చిత్రంలో ఉన్నాయి. ప్రస్తుత స్కీమాలు: {{formattedSchemas}}.',
            dont_show_again: 'మరలా చూపించవద్దు',
            change_schema: 'మార్చు',
            none: 'ఎదరికాదు',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'కాపీ విఫలమైంది',
                description: 'క్లిప్‌బోర్డ్ మద్దతు ఇవ్వదు',
            },
            failed: {
                title: 'కాపీ విఫలమైంది',
                description: 'ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
            },
        },

        theme: {
            system: 'సిస్టమ్',
            light: 'హালకా',
            dark: 'నలుపు',
        },

        zoom: {
            on: 'ఆన్',
            off: 'ఆఫ్',
        },

        last_saved: 'చివరిగా సేవ్ చేయబడిన',
        saved: 'సేవ్ చేయబడింది',
        loading_diagram: 'చిత్రం లోడ్ అవుతోంది...',
        deselect_all: 'అన్ని ఎంచుకోకుండా ఉంచు',
        select_all: 'అన్ని ఎంచుకోండి',
        clear: 'తొలగించు',
        show_more: 'మరింత చూపించు',
        show_less: 'తక్కువ చూపించు',
        copy_to_clipboard: 'క్లిప్బోర్డుకు కాపీ చేయండి',
        copied: 'కాపీ చేయబడింది!',

        side_panel: {
            schema: 'స్కీమా:',
            filter_by_schema: 'స్కీమా ద్వారా ఫిల్టర్ చేయండి',
            search_schema: 'స్కీమా కోసం శోధించండి...',
            no_schemas_found: 'ఏ స్కీమాలు కూడా కనుగొనబడలేదు.',
            view_all_options: 'అన్ని ఎంపికలను చూడండి...',
            tables_section: {
                tables: 'పట్టికలు',
                add_table: 'పట్టికను జోడించు',
                filter: 'ఫిల్టర్',
                collapse: 'అన్ని కూల్ చేయి',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'ఫీల్డులు',
                    nullable: 'నల్వాలు?',
                    primary_key: 'ప్రాథమిక కీ',
                    indexes: 'ఇండెక్సులు',
                    comments: 'వ్యాఖ్యలు',
                    no_comments: 'వ్యాఖ్యలు లేవు',
                    add_field: 'ఫీల్డ్ జోడించు',
                    add_index: 'ఇండెక్స్ జోడించు',
                    index_select_fields: 'ఫీల్డ్స్ ఎంచుకోండి',
                    no_types_found: 'ప్రకృతులు కనుగొనబడలేదు',
                    field_name: 'పేరు',
                    field_type: 'ప్రకృతి',
                    field_actions: {
                        title: 'ఫీల్డ్ గుణాలు',
                        unique: 'అద్వితీయ',
                        comments: 'వ్యాఖ్యలు',
                        no_comments: 'వ్యాఖ్యలు లేవు',
                        delete_field: 'ఫీల్డ్ తొలగించు',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'ఇండెక్స్ గుణాలు',
                        name: 'పేరు',
                        unique: 'అద్వితీయ',
                        delete_index: 'ఇండెక్స్ తొలగించు',
                    },
                    table_actions: {
                        title: 'పట్టిక చర్యలు',
                        change_schema: 'స్కీమాను మార్చు',
                        add_field: 'ఫీల్డ్ జోడించు',
                        add_index: 'ఇండెక్స్ జోడించు',
                        // TODO: Translate
                        duplicate_table: 'Duplicate Table',
                        delete_table: 'పట్టికను తొలగించు',
                    },
                },
                empty_state: {
                    title: 'పట్టికలు లేవు',
                    description: 'ప్రారంభించడానికి ఒక పట్టిక సృష్టించండి',
                },
            },
            relationships_section: {
                relationships: 'సంబంధాలు',
                filter: 'ఫిల్టర్',
                add_relationship: 'సంబంధం జోడించు',
                collapse: 'అన్ని కూల్ చేయి',
                relationship: {
                    primary: 'ప్రాథమిక పట్టిక',
                    foreign: 'సూచించబడిన పట్టిక',
                    cardinality: 'కార్డినాలిటీ',
                    delete_relationship: 'సంబంధం తొలగించు',
                    relationship_actions: {
                        title: 'చర్యలు',
                        delete_relationship: 'సంబంధం తొలగించు',
                    },
                },
                empty_state: {
                    title: 'సంబంధాలు లేవు',
                    description: 'పట్టికలను అనుసంధించడానికి సంబంధం సృష్టించండి',
                },
            },
            dependencies_section: {
                dependencies: 'ఆధారాలు',
                filter: 'ఫిల్టర్',
                collapse: 'అన్ని కూల్ చేయి',
                dependency: {
                    table: 'పట్టిక',
                    dependent_table: 'ఆధారిత వీక్షణ',
                    delete_dependency: 'ఆధారాన్ని తొలగించు',
                    dependency_actions: {
                        title: 'చర్యలు',
                        delete_dependency: 'ఆధారాన్ని తొలగించు',
                    },
                },
                empty_state: {
                    title: 'ఆధారాలు లేవు',
                    description: 'ప్రారంభించడానికి ఒక వీక్షణ సృష్టించండి',
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
            zoom_in: 'జూమ్ ఇన్',
            zoom_out: 'జూమ్ అవుట్',
            save: 'సేవ్',
            show_all: 'అన్ని చూపించు',
            undo: 'తిరిగి చేయు',
            redo: 'మరలా చేయు',
            reorder_diagram: 'చిత్రాన్ని పునఃసరిచేయండి',
            highlight_overlapping_tables: 'అవకాశించు పట్టికలను హైలైట్ చేయండి',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'మీ డేటాబేస్ ఏమిటి?',
                description:
                    'ప్రతి డేటాబేస్‌కు ప్రత్యేక లక్షణాలు మరియు సామర్థ్యాలు ఉంటాయి.',
                check_examples_long: 'ఉదాహరణలు చూడండి',
                check_examples_short: 'ఉదాహరణలు',
            },

            import_database: {
                title: 'మీ డేటాబేస్‌ను దిగుమతి చేసుకోండి',
                database_edition: 'డేటాబేస్ ఎడిషన్:',
                step_1: 'ఈ స్క్రిప్ట్ను మీ డేటాబేస్‌లో అమలు చేయండి:',
                step_2: 'స్క్రిప్ట్ ఫలితాన్ని ఇక్కడ పేస్ట్ చేయండి:',
                script_results_placeholder: 'స్క్రిప్ట్ ఫలితాలు ఇక్కడ...',
                ssms_instructions: {
                    button_text: 'SSMS సూచనల్ని చూపించు',
                    title: 'సూచనలు',
                    step_1: 'Tools > Options > Query Results > SQL Server కు వెళ్ళండి.',
                    step_2: 'మీరు "Results to Grid" ఉపయోగిస్తే, Maximum Characters Retrieved for Non-XML డేటా (9999999 కు సెట్ చేయండి) మార్చండి.',
                },
                instructions_link: 'సహాయం కావాలి? ఎలా చూడండి',
                check_script_result: 'స్క్రిప్ట్ ఫలితం తనిఖీ చేయండి',
            },

            cancel: 'రద్దు',
            // TODO: Translate
            import_from_file: 'Import from File',
            back: 'తిరుగు',
            empty_diagram: 'ఖాళీ చిత్రము',
            continue: 'కొనసాగించు',
            import: 'డిగుమతి',
        },

        open_diagram_dialog: {
            title: 'చిత్రం తెరవండి',
            description: 'కింద ఉన్న జాబితా నుండి చిత్రాన్ని ఎంచుకోండి.',
            table_columns: {
                name: 'పేరు',
                created_at: 'రచించబడిన తేదీ',
                last_modified: 'చివరి సవరణ',
                tables_count: 'పట్టికలు',
            },
            cancel: 'రద్దు',
            open: 'తెరవు',
        },

        export_sql_dialog: {
            title: 'SQL ఎగుమతి',
            description:
                'మీ చిత్ర స్కీమాను {{databaseType}} స్క్రిప్ట్‌గా ఎగుమతి చేయండి',
            close: 'మూసి వేయండి',
            loading: {
                text: '{{databaseType}} కోసం SQL ను ఉత్పత్తి చేయడంలో AI',
                description: 'ఇది 30 సెకన్లు పడుతుంది.',
            },
            error: {
                message:
                    'SQL స్క్రిప్ట్ ఉత్పత్తి చేయడంలో తప్పు. దయచేసి తర్వాతి సమయంలో ప్రయత్నించండి లేదా <0>మాతో సంప్రదించండి</0>.',
                description:
                    'మీ OPENAI_TOKEN ఉపయోగించి ప్రయత్నించండి, మాన్యువల్‌ను <0>ఇక్కడ</0> చూడండి.',
            },
        },

        create_relationship_dialog: {
            title: 'సంబంధం సృష్టించు',
            primary_table: 'ప్రాథమిక పట్టిక',
            primary_field: 'ప్రాథమిక ఫీల్డ్',
            referenced_table: 'సూచించబడిన పట్టిక',
            referenced_field: 'సూచించబడిన ఫీల్డ్',
            primary_table_placeholder: 'పట్టిక ఎంచుకోండి',
            primary_field_placeholder: 'ఫీల్డ్ ఎంచుకోండి',
            referenced_table_placeholder: 'పట్టిక ఎంచుకోండి',
            referenced_field_placeholder: 'ఫీల్డ్ ఎంచుకోండి',
            no_tables_found: 'ఏ పట్టికలు కూడా కనుగొనబడలేదు',
            no_fields_found: 'ఏ ఫీల్డ్‌లు కనుగొనబడలేదు',
            create: 'సృష్టించు',
            cancel: 'రద్దు',
        },

        import_database_dialog: {
            title: 'ప్రస్తుత చిత్రానికి దిగుమతి చేయండి',
            override_alert: {
                title: 'డేటాబేస్ దిగుమతి',
                content: {
                    alert: 'ఈ చిత్రాన్ని దిగుమతి చేసుకోవడం మునుపటి పట్టికలు మరియు సంబంధాలను ప్రభావితం చేస్తుంది.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> కొత్త పట్టికలు జోడించబడతాయి.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> కొత్త సంబంధాలు సృష్టించబడతాయి.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> పట్టికలు మళ్లీ రాయబడతాయి.',
                    proceed: 'మీరు కొనసాగించాలనుకుంటున్నారా?',
                },
                import: 'డిగుమతి',
                cancel: 'రద్దు',
            },
        },

        export_image_dialog: {
            title: 'చిత్రం ఎగుమతి',
            description: 'ఎగుమతి కోసం స్కేల్ ఫ్యాక్టర్ ఎంచుకోండి:',
            scale_1x: '1x సాధారణ',
            scale_2x: '2x (సిఫార్సు చేయబడినది)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'రద్దు',
            export: 'ఎగుమతి',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'స్కీమాను ఎంచుకోండి',
            description:
                'ప్రస్తుతం బహుళ స్కీమాలు చూపబడుతున్నాయి. కొత్త పట్టిక కోసం ఒకటి ఎంచుకోండి.',
            cancel: 'రద్దు',
            confirm: 'కన్ఫర్మ్',
        },

        update_table_schema_dialog: {
            title: 'స్కీమా మార్చు',
            description: '{{tableName}} పట్టిక యొక్క స్కీమాను నవీకరించండి',
            cancel: 'రద్దు',
            confirm: 'మార్చు',
        },

        star_us_dialog: {
            title: 'మా సహాయంతో మెరుగుపరచండి!',
            description:
                'మీకు GitHub‌లో మాకు స్టార్ ఇవ్వాలనుకుంటున్నారా? కేవలం ఒక క్లిక్ మాత్రమే!',
            close: 'ఇప్పుడు కాదు',
            confirm: 'ఖచ్చితంగా!',
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
            one_to_one: 'ఒకటి_కీ_ఒకటి',
            one_to_many: 'ఒకటి_కీ_చాలా',
            many_to_one: 'చాలా_కీ_ఒకటి',
            many_to_many: 'చాలా_కీ_చాలా',
        },

        canvas_context_menu: {
            new_table: 'కొత్త పట్టిక',
            new_relationship: 'కొత్త సంబంధం',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'పట్టికను సవరించు',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: 'పట్టికను తొలగించు',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Translate
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        // TODO: Translate
        tool_tips: {
            double_click_to_edit: 'Double-click to edit',
        },

        language_select: {
            change_language: 'భాష మార్చు',
        },
    },
};

export const teMetadata: LanguageMetadata = {
    name: 'Telugu',
    nativeName: 'తెలుగు',
    code: 'te',
};
