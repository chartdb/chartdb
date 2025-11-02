import type { LanguageMetadata, LanguageTranslation } from '../types';

export const te: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'కొత్తది',
            browse: 'బ్రాఉజ్',
            tables: 'టేబల్లు',
            refs: 'సంబంధాలు',
            dependencies: 'ఆధారతలు',
            custom_types: 'కస్టమ్ టైప్స్',
            visuals: 'Visuals',
        },
        menu: {
            actions: {
                actions: 'చర్యలు',
                new: 'కొత్తది...',
                browse: 'బ్రాఉజ్ చేయండి...',
                save: 'సేవ్',
                import: 'డేటాబేస్‌ను దిగుమతి చేసుకోండి',
                export_sql: 'SQL ఎగుమతి',
                export_as: 'వగా ఎగుమతి చేయండి',
                delete_diagram: 'తొలగించండి',
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
                show_field_attributes: 'ఫీల్డ్ గుణాలను చూపించు',
                hide_field_attributes: 'ఫీల్డ్ గుణాలను దాచండి',
                zoom_on_scroll: 'స్క్రోల్‌పై జూమ్',
                show_views: 'డేటాబేస్ వ్యూలు',
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
            title: 'చిత్రాన్ని స్వయంచాలకంగా అమర్చండి',
            description:
                'ఈ చర్య చిత్రంలోని అన్ని పట్టికలను పునఃస్థాపిస్తుంది. మీరు కొనసాగించాలనుకుంటున్నారా?',
            reorder: 'స్వయంచాలకంగా అమర్చండి',
            cancel: 'రద్దు',
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
            view_all_options: 'అన్ని ఎంపికలను చూడండి...',
            tables_section: {
                tables: 'పట్టికలు',
                add_table: 'పట్టికను జోడించు',
                add_view: 'వ్యూ జోడించండి',
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
                        auto_increment: 'ఆటో ఇంక్రిమెంట్',
                        comments: 'వ్యాఖ్యలు',
                        no_comments: 'వ్యాఖ్యలు లేవు',
                        delete_field: 'ఫీల్డ్ తొలగించు',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'సూక్ష్మత',
                        scale: 'స్కేల్',
                    },
                    index_actions: {
                        title: 'ఇండెక్స్ గుణాలు',
                        name: 'పేరు',
                        unique: 'అద్వితీయ',
                        index_type: 'ఇండెక్స్ రకం',
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
            refs_section: {
                refs: 'Refs',
                filter: 'ఫిల్టర్',
                collapse: 'అన్ని కూల్ చేయి',
                add_relationship: 'సంబంధం జోడించు',
                relationships: 'సంబంధాలు',
                dependencies: 'ఆధారాలు',
                relationship: {
                    relationship: 'సంబంధం',
                    primary: 'ప్రాథమిక పట్టిక',
                    foreign: 'సూచించబడిన పట్టిక',
                    cardinality: 'కార్డినాలిటీ',
                    delete_relationship: 'సంబంధం తొలగించు',
                    relationship_actions: {
                        title: 'చర్యలు',
                        delete_relationship: 'సంబంధం తొలగించు',
                    },
                },
                dependency: {
                    dependency: 'ఆధారం',
                    table: 'పట్టిక',
                    dependent_table: 'ఆధారిత వీక్షణ',
                    delete_dependency: 'ఆధారాన్ని తొలగించు',
                    dependency_actions: {
                        title: 'చర్యలు',
                        delete_dependency: 'ఆధారాన్ని తొలగించు',
                    },
                },
                empty_state: {
                    title: 'సంబంధాలు లేవు',
                    description: 'ప్రారంభించడానికి ఒక సంబంధం సృష్టించండి',
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
                visuals: 'Visuals',
                tabs: {
                    areas: 'Areas',
                    notes: 'గమనికలు',
                },
            },

            notes_section: {
                filter: 'ఫిల్టర్',
                add_note: 'గమనిక జోడించండి',
                no_results: 'గమనికలు కనుగొనబడలేదు',
                clear: 'ఫిల్టర్‌ను క్లియర్ చేయండి',
                empty_state: {
                    title: 'గమనికలు లేవు',
                    description:
                        'కాన్వాస్‌పై టెక్స్ట్ ఉల్లేఖనలను జోడించడానికి ఒక గమనికను సృష్టించండి',
                },
                note: {
                    empty_note: 'ఖాళీ గమనిక',
                    note_actions: {
                        title: 'గమనిక చర్యలు',
                        edit_content: 'కంటెంట్‌ను సవరించండి',
                        delete_note: 'గమనికను తొలగించండి',
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
                    no_values: 'ఏ enum విలువలు నిర్వచించబడలేదు',
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
            zoom_in: 'జూమ్ ఇన్',
            zoom_out: 'జూమ్ అవుట్',
            save: 'సేవ్',
            show_all: 'అన్ని చూపించు',
            undo: 'తిరిగి చేయు',
            redo: 'మరలా చేయు',
            reorder_diagram: 'చిత్రాన్ని స్వయంచాలకంగా అమర్చండి',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'అవకాశించు పట్టికలను హైలైట్ చేయండి',
            // TODO: Translate
            filter: 'Filter Tables',
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
                step_2: 'స్క్రిప్ట్ ఫలితాన్ని ఇక్కడ పేస్ట్ చేయండి →',
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
            empty_diagram: 'ఖాళీ డేటాబేస్',
            continue: 'కొనసాగించు',
            import: 'డిగుమతి',
        },

        open_diagram_dialog: {
            title: 'డేటాబేస్ తెరవండి',
            description: 'కింద ఉన్న జాబితా నుండి చిత్రాన్ని ఎంచుకోండి.',
            table_columns: {
                name: 'పేరు',
                created_at: 'రచించబడిన తేదీ',
                last_modified: 'చివరి సవరణ',
                tables_count: 'పట్టికలు',
            },
            cancel: 'రద్దు',
            open: 'తెరవు',

            diagram_actions: {
                open: 'తెరవు',
                duplicate: 'నకలు',
                delete: 'తొలగించు',
            },
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

        create_table_schema_dialog: {
            title: 'కొత్త స్కీమా సృష్టించండి',
            description:
                'ఇంకా ఏ స్కీమాలు లేవు. మీ పట్టికలను వ్యవస్థీకరించడానికి మీ మొదటి స్కీమాను సృష్టించండి.',
            create: 'సృష్టించు',
            cancel: 'రద్దు',
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
            new_view: 'కొత్త వ్యూ',
            new_relationship: 'కొత్త సంబంధం',
            // TODO: Translate
            new_area: 'New Area',
            new_note: 'కొత్త నోట్',
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

        on: 'ఆన్',
        off: 'ఆఫ్',
    },
};

export const teMetadata: LanguageMetadata = {
    name: 'Telugu',
    nativeName: 'తెలుగు',
    code: 'te',
};
