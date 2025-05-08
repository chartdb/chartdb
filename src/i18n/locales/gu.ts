import type { LanguageMetadata, LanguageTranslation } from '../types';

export const gu: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'ફાઇલ',
                new: 'નવું',
                open: 'ખોલો',
                save: 'સાચવો',
                import: 'ડેટાબેસ આયાત કરો',
                export_sql: 'SQL નિકાસ કરો',
                export_as: 'રૂપે નિકાસ કરો',
                delete_diagram: 'ડાયાગ્રામ કાઢી નાખો',
                exit: 'બહાર જાઓ',
            },
            edit: {
                edit: 'ફેરફાર',
                undo: 'અનડુ',
                redo: 'રીડુ',
                clear: 'સાફ કરો',
            },
            view: {
                view: 'જુઓ',
                show_sidebar: 'સાઇડબાર બતાવો',
                hide_sidebar: 'સાઇડબાર છુપાવો',
                hide_cardinality: 'કાર્ડિનાલિટી છુપાવો',
                show_cardinality: 'કાર્ડિનાલિટી બતાવો',
                zoom_on_scroll: 'સ્ક્રોલ પર ઝૂમ કરો',
                theme: 'થિમ',
                show_dependencies: 'નિર્ભરતાઓ બતાવો',
                hide_dependencies: 'નિર્ભરતાઓ છુપાવો',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },

            backup: {
                backup: 'બેકઅપ',
                export_diagram: 'ડાયાગ્રામ નિકાસ કરો',
                restore_diagram: 'ડાયાગ્રામ પુનઃસ્થાપિત કરો',
            },
            help: {
                help: 'મદદ',
                docs_website: 'દસ્તાવેજીકરણ',
                join_discord: 'અમારા Discordમાં જોડાઓ',
            },
        },

        delete_diagram_alert: {
            title: 'ડાયાગ્રામ કાઢી નાખો',
            description:
                'આ ક્રિયા પરત નહીં લઇ શકાય. આ ડાયાગ્રામ કાયમ માટે કાઢી નાખવામાં આવશે.',
            cancel: 'રદ કરો',
            delete: 'કાઢી નાખો',
        },

        clear_diagram_alert: {
            title: 'ડાયાગ્રામ સાફ કરો',
            description:
                'આ ક્રિયા પરત નહીં લઇ શકાય. આ ડાયાગ્રામમાં બધા ડેટા કાયમ માટે કાઢી નાખશે.',
            cancel: 'રદ કરો',
            clear: 'સાફ કરો',
        },

        reorder_diagram_alert: {
            title: 'ડાયાગ્રામ ફરી વ્યવસ્થિત કરો',
            description:
                'આ ક્રિયા ડાયાગ્રામમાં બધી ટેબલ્સને ફરીથી વ્યવસ્થિત કરશે. શું તમે ચાલુ રાખવા માંગો છો?',
            reorder: 'ફરી વ્યવસ્થિત કરો',
            cancel: 'રદ કરો',
        },

        multiple_schemas_alert: {
            title: 'કઈંક વધારે સ્કીમા',
            description:
                '{{schemasCount}} સ્કીમા આ ડાયાગ્રામમાં છે. હાલમાં દર્શાવેલ છે: {{formattedSchemas}}.',
            dont_show_again: 'ફરીથી ન બતાવો',
            change_schema: 'બદલો',
            none: 'કઈ નહીં',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'નકલ નિષ્ફળ',
                description: 'ક્લિપબોર્ડ આધારિત નથી',
            },
            failed: {
                title: 'નકલ નિષ્ફળ',
                description: 'કંઈક ખોટું થયું છે. કૃપા કરીને ફરી પ્રયાસ કરો.',
            },
        },

        theme: {
            system: 'સિસ્ટમ',
            light: 'હલકો',
            dark: 'ઘાટો',
        },

        zoom: {
            on: 'ચાલુ',
            off: 'બંધ',
        },

        last_saved: 'છેલ્લે સાચવ્યું',
        saved: 'સાચવ્યું',
        loading_diagram: 'ડાયાગ્રામ લોડ થઈ રહ્યું છે...',
        deselect_all: 'બધાને ડીસેલેક્ટ કરો',
        select_all: 'બધા પસંદ કરો',
        clear: 'સાફ કરો',
        show_more: 'વધુ બતાવો',
        show_less: 'ઓછું બતાવો',
        copy_to_clipboard: 'ક્લિપબોર્ડમાં નકલ કરો',
        copied: 'નકલ થયું!',

        side_panel: {
            schema: 'સ્કીમા:',
            filter_by_schema: 'સ્કીમા દ્વારા ફિલ્ટર કરો',
            search_schema: 'સ્કીમા શોધો...',
            no_schemas_found: 'કોઈ સ્કીમા મળ્યા નથી.',
            view_all_options: 'બધા વિકલ્પો જુઓ...',
            tables_section: {
                tables: 'ટેબલ્સ',
                add_table: 'ટેબલ ઉમેરો',
                filter: 'ફિલ્ટર',
                collapse: 'બધાને સકુચિત કરો',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'ફીલ્ડ્સ',
                    //TODO translate
                    nullable: 'Nullable?',
                    primary_key: 'પ્રાથમિક કી',
                    indexes: 'ઈન્ડેક્સ',
                    comments: 'ટિપ્પણીઓ',
                    no_comments: 'કોઈ ટિપ્પણીઓ નથી',
                    add_field: 'ફીલ્ડ ઉમેરો',
                    add_index: 'ઈન્ડેક્સ ઉમેરો',
                    index_select_fields: 'ફીલ્ડ્સ પસંદ કરો',
                    no_types_found: 'કોઈ પ્રકાર મળ્યા નથી',
                    field_name: 'નામ',
                    field_type: 'પ્રકાર',
                    field_actions: {
                        title: 'ફીલ્ડ લક્ષણો',
                        unique: 'અદ્વિતીય',
                        comments: 'ટિપ્પણીઓ',
                        no_comments: 'કોઈ ટિપ્પણીઓ નથી',
                        delete_field: 'ફીલ્ડ કાઢી નાખો',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'ઇન્ડેક્સ લક્ષણો',
                        name: 'નામ',
                        unique: 'અદ્વિતીય',
                        delete_index: 'ઇન્ડેક્સ કાઢી નાખો',
                    },
                    table_actions: {
                        title: 'ટેબલ ક્રિયાઓ',
                        change_schema: 'સ્કીમા બદલો',
                        add_field: 'ફીલ્ડ ઉમેરો',
                        add_index: 'ઇન્ડેક્સ ઉમેરો',
                        duplicate_table: 'ટેબલ ડુપ્લિકેટ કરો',
                        delete_table: 'ટેબલ કાઢી નાખો',
                    },
                },
                empty_state: {
                    title: 'કોઈ ટેબલ્સ નથી',
                    description: 'શરૂ કરવા માટે એક ટેબલ બનાવો',
                },
            },
            relationships_section: {
                relationships: 'સંબંધો',
                filter: 'ફિલ્ટર',
                add_relationship: 'સંબંધ ઉમેરો',
                collapse: 'બધાને સકુચિત કરો',
                relationship: {
                    primary: 'પ્રાથમિક ટેબલ',
                    foreign: 'સંદર્ભ ટેબલ',
                    cardinality: 'કાર્ડિનાલિટી',
                    delete_relationship: 'કાઢી નાખો',
                    relationship_actions: {
                        title: 'ક્રિયાઓ',
                        delete_relationship: 'કાઢી નાખો',
                    },
                },
                empty_state: {
                    title: 'કોઈ સંબંધો નથી',
                    description: 'ટેબલ્સ કનેક્ટ કરવા માટે એક સંબંધ બનાવો',
                },
            },
            dependencies_section: {
                dependencies: 'નિર્ભરતાઓ',
                filter: 'ફિલ્ટર',
                collapse: 'સિકોડો',
                dependency: {
                    table: 'ટેબલ',
                    dependent_table: 'આધાર રાખેલું ટેબલ',
                    delete_dependency: 'નિર્ભરતા કાઢી નાખો',
                    dependency_actions: {
                        title: 'ક્રિયાઓ',
                        delete_dependency: 'નિર્ભરતા કાઢી નાખો',
                    },
                },
                empty_state: {
                    title: 'કોઈ નિર્ભરતાઓ નથી',
                    description: 'આ વિભાગમાં કોઈ નિર્ભરતા ઉપલબ્ધ નથી.',
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
            zoom_in: 'ઝૂમ ઇન',
            zoom_out: 'ઝૂમ આઉટ',
            save: 'સાચવો',
            show_all: 'બધું બતાવો',
            undo: 'અનડુ',
            redo: 'રીડુ',
            reorder_diagram: 'ડાયાગ્રામ ફરીથી વ્યવસ્થિત કરો',
            highlight_overlapping_tables: 'ઓવરલેપ કરતો ટેબલ હાઇલાઇટ કરો',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'તમારું ડેટાબેસ શું છે?',
                description: 'દરેક ડેટાબેસની પોતાની ખાસિયતો અને ક્ષમતા હોય છે.',
                check_examples_long: 'ઉદાહરણ જુઓ',
                check_examples_short: 'ઉદાહરણ',
            },

            import_database: {
                title: 'તમારું ડેટાબેસ આયાત કરો',
                database_edition: 'ડેટાબેસ આવૃત્તિ:',
                step_1: 'તમારા ડેટાબેસમાં આ સ્ક્રિપ્ટ ચલાવો:',
                step_2: 'સ્ક્રિપ્ટનો પરિણામ અહીં પેસ્ટ કરો:',
                script_results_placeholder: 'સ્ક્રિપ્ટના પરિણામ અહીં...',
                ssms_instructions: {
                    button_text: 'SSMS સૂચનાઓ',
                    title: 'સૂચનાઓ',
                    step_1: 'ટૂલ્સ > વિકલ્પો > ક્વેરી પરિણામો > SQL સર્વર પર જાઓ.',
                    step_2: 'જો તમે "ગ્રિડમાં પરિણામો" નો ઉપયોગ કરી રહ્યા છો, તો નોન-XML ડેટા માટે મહત્તમ અક્ષરો મેળવવું (9999999 પર સેટ કરો).',
                },
                instructions_link: 'મદદ જોઈએ? અહીં જુઓ',
                check_script_result: 'સ્ક્રિપ્ટ પરિણામ તપાસો',
            },

            cancel: 'રદ કરો',
            back: 'પાછા',
            import_from_file: 'ફાઇલમાંથી આયાત કરો',
            empty_diagram: 'ખાલી ડાયાગ્રામ',
            continue: 'ચાલુ રાખો',
            import: 'આયાત કરો',
        },

        open_diagram_dialog: {
            title: 'ડાયાગ્રામ ખોલો',
            description: 'નીચેની યાદીમાંથી એક ડાયાગ્રામ પસંદ કરો.',
            table_columns: {
                name: 'નામ',
                created_at: 'બનાવાની તારીખ',
                last_modified: 'છેલ્લું સુધારેલું',
                tables_count: 'ટેબલ્સ',
            },
            cancel: 'રદ કરો',
            open: 'ખોલો',
        },

        export_sql_dialog: {
            title: 'SQL નિકાસ કરો',
            description:
                '{{databaseType}} સ્ક્રિપ્ટ માટે તમારું ડાયાગ્રામ સ્કીમા નિકાસ કરો',
            close: 'બંધ કરો',
            loading: {
                text: '{{databaseType}} માટે AI SQL બનાવી રહ્યું છે...',
                description: 'તેને 30 સેકંડ સુધીનો સમય લાગી શકે છે.',
            },
            error: {
                message:
                    'SQL સ્ક્રિપ્ટ જનરેટ કરવા દરમિયાન ભૂલ થઈ. કૃપા કરીને પછીથી ફરી પ્રયત્ન કરો અથવા <0>અમારો સંપર્ક કરો</0>.',
                description:
                    'તમારા OPENAI_TOKEN નો ઉપયોગ કરવા માટે મફત અનુભવો, મેન્યુઅલ <0>અહીં જુઓ</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'સંબંધ બનાવો',
            primary_table: 'પ્રાથમિક ટેબલ',
            primary_field: 'પ્રાથમિક ફીલ્ડ',
            referenced_table: 'સંદર્ભિત ટેબલ',
            referenced_field: 'સંદર્ભિત ફીલ્ડ',
            primary_table_placeholder: 'ટેબલ પસંદ કરો',
            primary_field_placeholder: 'ફીલ્ડ પસંદ કરો',
            referenced_table_placeholder: 'ટેબલ પસંદ કરો',
            referenced_field_placeholder: 'ફીલ્ડ પસંદ કરો',
            no_tables_found: 'કોઈ ટેબલ મળી નથી',
            no_fields_found: 'કોઈ ફીલ્ડ મળી નથી',
            create: 'બનાવો',
            cancel: 'રદ કરો',
        },

        import_database_dialog: {
            title: 'વર્તમાન ડાયાગ્રામમાં આયાત કરો',
            override_alert: {
                title: 'ડેટાબેસ આયાત કરો',
                content: {
                    alert: 'આ ડાયાગ્રામ આયાત કરવાથી હાલના ટેબલ્સ અને સંબંધો પર અસર થશે.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> નવા ટેબલ ઉમેરવામાં આવશે.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> નવા સંબંધો બનાવવામાં આવશે.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> ટેબલ ઓવરરાઇટ કરાશે.',
                    proceed: 'શું તમે આગળ વધવા માંગો છો?',
                },
                import: 'આયાત કરો',
                cancel: 'રદ કરો',
            },
        },

        export_image_dialog: {
            title: 'છબી નિકાસ કરો',
            description: 'નિકાસ માટે સ્કેલ ફેક્ટર પસંદ કરો:',
            scale_1x: '1x સામાન્ય',
            scale_2x: '2x (ભલામણ કરેલું)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'રદ કરો',
            export: 'નિકાસ કરો',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'સ્કીમા પસંદ કરો',
            description:
                'વર્તમાનમાં ઘણા સ્કીમા દર્શાવવામાં આવે છે. નવું ટેબલ માટે એક પસંદ કરો.',
            cancel: 'રદ કરો',
            confirm: 'ખાતરી કરો',
        },

        update_table_schema_dialog: {
            title: 'સ્કીમા બદલો',
            description: 'ટેબલ "{{tableName}}" માટે સ્કીમા અપડેટ કરો',
            cancel: 'રદ કરો',
            confirm: 'બદલો',
        },

        star_us_dialog: {
            title: 'અમને સુધારવામાં મદદ કરો!',
            description:
                'શું તમે GitHub પર અમને સ્ટાર આપી શકો છો? તે માત્ર એક ક્લિક દૂર છે!',
            close: 'હાલમાં નહીં',
            confirm: 'ખરેખર!',
        },

        export_diagram_dialog: {
            title: 'ડાયાગ્રામ નિકાસ કરો',
            description: 'નિકાસ માટે ફોર્મેટ પસંદ કરો:',
            format_json: 'JSON',
            cancel: 'રદ કરો',
            export: 'નિકાસ કરો',
            error: {
                title: 'ડાયાગ્રામ નિકાસમાં ભૂલ',
                description:
                    'કશુક તો ખોટું થયું. મદદ જોઈએ? support@chartdb.io પર સંપર્ક કરો.',
            },
        },

        import_diagram_dialog: {
            title: 'ડાયાગ્રામ આયાત કરો',
            description: 'નીચે ડાયાગ્રામ JSON પેસ્ટ કરો:',
            cancel: 'રદ કરો',
            import: 'આયાત કરો',
            error: {
                title: 'ડાયાગ્રામ આયાતમાં ભૂલ',
                description:
                    'ડાયાગ્રામ JSON અમાન્ય છે. કૃપા કરીને JSON તપાસો અને ફરી પ્રયાસ કરો. મદદ જોઈએ? support@chartdb.io પર સંપર્ક કરો.',
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
            one_to_one: 'એકથી એક',
            one_to_many: 'એકથી ઘણા',
            many_to_one: 'ઘણા થી એક',
            many_to_many: 'ઘણાથી ઘણા',
        },

        canvas_context_menu: {
            new_table: 'નવું ટેબલ',
            new_relationship: 'નવો સંબંધ',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'ટેબલ સંપાદિત કરો',
            duplicate_table: 'ટેબલ નકલ કરો',
            delete_table: 'ટેબલ કાઢી નાખો',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: 'ગ્રિડ પર સ્નેપ કરો (જમાવટ {{key}})',

        tool_tips: {
            double_click_to_edit: 'સંપાદિત કરવા માટે ડબલ-ક્લિક કરો',
        },

        language_select: {
            change_language: 'ભાષા બદલો',
        },
    },
};

export const guMetadata: LanguageMetadata = {
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    code: 'gu',
};
