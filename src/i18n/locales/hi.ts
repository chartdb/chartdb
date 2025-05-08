import type { LanguageMetadata, LanguageTranslation } from '../types';

export const hi: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'फ़ाइल',
                new: 'नया',
                open: 'खोलें',
                save: 'सहेजें',
                import: 'डेटाबेस आयात करें',
                export_sql: 'SQL निर्यात करें',
                export_as: 'के रूप में निर्यात करें',
                delete_diagram: 'आरेख हटाएँ',
                exit: 'बाहर जाएँ',
            },
            edit: {
                edit: 'संपादित करें',
                undo: 'पूर्ववत करें',
                redo: 'पुनः करें',
                clear: 'साफ़ करें',
            },
            view: {
                view: 'देखें',
                show_sidebar: 'साइडबार दिखाएँ',
                hide_sidebar: 'साइडबार छिपाएँ',
                hide_cardinality: 'कार्डिनैलिटी छिपाएँ',
                show_cardinality: 'कार्डिनैलिटी दिखाएँ',
                zoom_on_scroll: 'स्क्रॉल पर ज़ूम',
                theme: 'थीम',
                show_dependencies: 'निर्भरता दिखाएँ',
                hide_dependencies: 'निर्भरता छिपाएँ',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: 'बैकअप',
                export_diagram: 'आरेख निर्यात करें',
                restore_diagram: 'आरेख पुनर्स्थापित करें',
            },
            help: {
                help: 'मदद',
                docs_website: 'દસ્તાવેજીકરણ',
                join_discord: 'हमसे Discord पर जुड़ें',
            },
        },

        delete_diagram_alert: {
            title: 'आरेख हटाएँ',
            description:
                'यह क्रिया पूर्ववत नहीं की जा सकती। यह आरेख स्थायी रूप से हटा दिया जाएगा।',
            cancel: 'रद्द करें',
            delete: 'हटाएँ',
        },

        clear_diagram_alert: {
            title: 'आरेख साफ़ करें',
            description:
                'यह क्रिया पूर्ववत नहीं की जा सकती। यह आरेख में सभी डेटा को स्थायी रूप से हटा देगी।',
            cancel: 'रद्द करें',
            clear: 'साफ़ करें',
        },

        reorder_diagram_alert: {
            title: 'आरेख पुनः व्यवस्थित करें',
            description:
                'यह क्रिया आरेख में सभी तालिकाओं को पुनः व्यवस्थित कर देगी। क्या आप जारी रखना चाहते हैं?',
            reorder: 'पुनः व्यवस्थित करें',
            cancel: 'रद्द करें',
        },

        multiple_schemas_alert: {
            title: 'एकाधिक स्कीमा',
            description:
                '{{schemasCount}} स्कीमा इस आरेख में हैं। वर्तमान में प्रदर्शित: {{formattedSchemas}}।',
            dont_show_again: 'फिर से न दिखाएँ',
            change_schema: 'बदलें',
            none: 'कोई नहीं',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'कॉपी असफल',
                description: 'क्लिपबोर्ड समर्थित नहीं है',
            },
            failed: {
                title: 'कॉपी असफल',
                description: 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
            },
        },

        theme: {
            system: 'सिस्टम',
            light: 'हल्का',
            dark: 'गहरा',
        },

        zoom: {
            on: 'चालू',
            off: 'बंद',
        },

        last_saved: 'अंतिम सहेजा गया',
        saved: 'सहेजा गया',
        loading_diagram: 'आरेख लोड हो रहा है...',
        deselect_all: 'सभी को अचयनित करें',
        select_all: 'सभी को चुनें',
        clear: 'साफ़ करें',
        show_more: 'अधिक दिखाएँ',
        show_less: 'कम दिखाएँ',
        // TODO: Translate
        copy_to_clipboard: 'Copy to Clipboard',
        copied: 'Copied!',

        side_panel: {
            schema: 'स्कीमा:',
            filter_by_schema: 'स्कीमा द्वारा फ़िल्टर करें',
            search_schema: 'स्कीमा खोजें...',
            no_schemas_found: 'कोई स्कीमा नहीं मिला।',
            view_all_options: 'सभी विकल्प देखें...',
            tables_section: {
                tables: 'तालिकाएँ',
                add_table: 'तालिका जोड़ें',
                filter: 'फ़िल्टर',
                collapse: 'सभी को संक्षिप्त करें',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'फ़ील्ड्स',
                    nullable: 'Nullable?',
                    primary_key: 'प्राथमिक कुंजी',
                    indexes: 'सूचकांक',
                    comments: 'टिप्पणियाँ',
                    no_comments: 'कोई टिप्पणी नहीं',
                    add_field: 'फ़ील्ड जोड़ें',
                    add_index: 'सूचकांक जोड़ें',
                    index_select_fields: 'फ़ील्ड्स चुनें',
                    no_types_found: 'कोई प्रकार नहीं मिला',
                    field_name: 'नाम',
                    field_type: 'प्रकार',
                    field_actions: {
                        title: 'फ़ील्ड विशेषताएँ',
                        unique: 'अद्वितीय',
                        comments: 'टिप्पणियाँ',
                        no_comments: 'कोई टिप्पणी नहीं',
                        delete_field: 'फ़ील्ड हटाएँ',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'सूचकांक विशेषताएँ',
                        name: 'नाम',
                        unique: 'अद्वितीय',
                        delete_index: 'सूचकांक हटाएँ',
                    },
                    table_actions: {
                        title: 'तालिका क्रियाएँ',
                        change_schema: 'स्कीमा बदलें',
                        add_field: 'फ़ील्ड जोड़ें',
                        add_index: 'सूचकांक जोड़ें',
                        duplicate_table: 'Duplicate Table', // TODO: Translate
                        delete_table: 'तालिका हटाएँ',
                    },
                },
                empty_state: {
                    title: 'कोई तालिकाएँ नहीं',
                    description: 'शुरू करने के लिए एक तालिका बनाएँ',
                },
            },
            relationships_section: {
                relationships: 'संबंध',
                filter: 'फ़िल्टर',
                add_relationship: 'संबंध जोड़ें',
                collapse: 'सभी को संक्षिप्त करें',
                relationship: {
                    primary: 'प्राथमिक तालिका',
                    foreign: 'संदर्भित तालिका',
                    cardinality: 'कार्डिनैलिटी',
                    delete_relationship: 'हटाएँ',
                    relationship_actions: {
                        title: 'क्रियाएँ',
                        delete_relationship: 'हटाएँ',
                    },
                },
                empty_state: {
                    title: 'कोई संबंध नहीं',
                    description:
                        'तालिकाओं को कनेक्ट करने के लिए एक संबंध बनाएँ',
                },
            },
            dependencies_section: {
                dependencies: 'निर्भरताएँ',
                filter: 'फ़िल्टर',
                collapse: 'सिकोड़ें',
                dependency: {
                    table: 'तालिका',
                    dependent_table: 'आश्रित तालिका',
                    delete_dependency: 'निर्भरता हटाएँ',
                    dependency_actions: {
                        title: 'कार्रवाइयाँ',
                        delete_dependency: 'निर्भरता हटाएँ',
                    },
                },
                empty_state: {
                    title: 'कोई निर्भरता नहीं',
                    description: 'इस अनुभाग में कोई निर्भरता उपलब्ध नहीं है।',
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
            zoom_in: 'ज़ूम इन',
            zoom_out: 'ज़ूम आउट',
            save: 'सहेजें',
            show_all: 'सभी दिखाएँ',
            undo: 'पूर्ववत करें',
            redo: 'पुनः करें',
            reorder_diagram: 'आरेख पुनः व्यवस्थित करें',
            highlight_overlapping_tables: 'ओवरलैपिंग तालिकाओं को हाइलाइट करें',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'आपका डेटाबेस क्या है?',
                description:
                    'प्रत्येक डेटाबेस की अपनी अनूठी विशेषताएँ और क्षमताएँ होती हैं।',
                check_examples_long: 'उदाहरण देखें',
                check_examples_short: 'उदाहरण',
            },

            import_database: {
                title: 'अपना डेटाबेस आयात करें',
                database_edition: 'डेटाबेस संस्करण:',
                step_1: 'अपने डेटाबेस में यह स्क्रिप्ट चलाएँ:',
                step_2: 'यहाँ स्क्रिप्ट का परिणाम पेस्ट करें:',
                script_results_placeholder: 'स्क्रिप्ट के परिणाम यहाँ...',
                ssms_instructions: {
                    button_text: 'SSMS निर्देश',
                    title: 'निर्देश',
                    step_1: 'टूल्स > ऑप्शंस > क्वेरी परिणाम > SQL सर्वर पर जाएँ।',
                    step_2: 'यदि आप "ग्रिड में परिणाम" का उपयोग कर रहे हैं, तो Non-XML डेटा के लिए अधिकतम वर्ण प्राप्ति (9999999 पर सेट करें)।',
                },
                instructions_link: 'मदद चाहिए? देखें कैसे',
                // TODO: Translate
                check_script_result: 'Check Script Result',
            },

            cancel: 'रद्द करें',
            back: 'वापस',
            // TODO: Translate
            import_from_file: 'Import from File',
            empty_diagram: 'खाली आरेख',
            continue: 'जारी रखें',
            import: 'आयात करें',
        },

        open_diagram_dialog: {
            title: 'आरेख खोलें',
            description: 'नीचे दी गई सूची से एक आरेख चुनें।',
            table_columns: {
                name: 'नाम',
                created_at: 'निर्माण तिथि',
                last_modified: 'अंतिम संशोधन',
                tables_count: 'तालिकाएँ',
            },
            cancel: 'रद्द करें',
            open: 'खोलें',
        },

        export_sql_dialog: {
            title: 'SQL निर्यात करें',
            description:
                '{{databaseType}} स्क्रिप्ट के लिए आपका आरेख स्कीमा निर्यात करें',
            close: 'बंद करें',
            loading: {
                text: '{{databaseType}} के लिए AI SQL बना रहा है...',
                description: 'इसमें 30 सेकंड तक का समय लग सकता है।',
            },
            error: {
                message:
                    'SQL स्क्रिप्ट उत्पन्न करने में त्रुटि। कृपया बाद में पुनः प्रयास करें या <0>हमसे संपर्क करें</0>।',
                description:
                    'अपने OPENAI_TOKEN का उपयोग करने के लिए स्वतंत्र महसूस करें, मैनुअल <0>यहाँ देखें</0>।',
            },
        },

        create_relationship_dialog: {
            title: 'संबंध बनाएँ',
            primary_table: 'प्राथमिक तालिका',
            primary_field: 'प्राथमिक फ़ील्ड',
            referenced_table: 'संदर्भित तालिका',
            referenced_field: 'संदर्भित फ़ील्ड',
            primary_table_placeholder: 'तालिका चुनें',
            primary_field_placeholder: 'फ़ील्ड चुनें',
            referenced_table_placeholder: 'तालिका चुनें',
            referenced_field_placeholder: 'फ़ील्ड चुनें',
            no_tables_found: 'कोई तालिकाएँ नहीं मिलीं',
            no_fields_found: 'कोई फ़ील्ड्स नहीं मिलीं',
            create: 'बनाएँ',
            cancel: 'रद्द करें',
        },

        import_database_dialog: {
            title: 'वर्तमान आरेख में आयात करें',
            override_alert: {
                title: 'डेटाबेस आयात करें',
                content: {
                    alert: 'इस आरेख को आयात करने से मौजूदा तालिकाओं और संबंधों पर प्रभाव पड़ेगा।',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> नई तालिकाएँ जोड़ी जाएँगी।',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> नए संबंध बनाए जाएँगे।',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> तालिकाएँ अधिलेखित की जाएँगी।',
                    proceed: 'क्या आप जारी रखना चाहते हैं?',
                },
                import: 'आयात करें',
                cancel: 'रद्द करें',
            },
        },

        export_image_dialog: {
            title: 'छवि निर्यात करें',
            description: 'निर्यात के लिए स्केल फ़ैक्टर चुनें:',
            scale_1x: '1x सामान्य',
            scale_2x: '2x (अनुशंसित)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'रद्द करें',
            export: 'निर्यात करें',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'स्कीमा चुनें',
            description:
                'वर्तमान में कई स्कीमा प्रदर्शित हैं। नई तालिका के लिए एक चुनें।',
            cancel: 'रद्द करें',
            confirm: 'पुष्टि करें',
        },

        update_table_schema_dialog: {
            title: 'स्कीमा बदलें',
            description: 'तालिका "{{tableName}}" का स्कीमा अपडेट करें',
            cancel: 'रद्द करें',
            confirm: 'बदलें',
        },

        star_us_dialog: {
            title: 'हमें सुधारने में मदद करें!',
            description:
                'क्या आप हमें GitHub पर स्टार देना चाहेंगे? यह बस एक क्लिक की दूरी पर है!',
            close: 'अभी नहीं',
            confirm: 'बिलकुल!',
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
            one_to_one: 'एक से एक',
            one_to_many: 'एक से कई',
            many_to_one: 'कई से एक',
            many_to_many: 'कई से कई',
        },

        canvas_context_menu: {
            new_table: 'नई तालिका',
            new_relationship: 'नया संबंध',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'तालिका संपादित करें',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: 'तालिका हटाएँ',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'संपादित करने के लिए डबल-क्लिक करें',
        },

        language_select: {
            change_language: 'भाषा बदलें',
        },
    },
};

export const hiMetadata: LanguageMetadata = {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    code: 'hi',
};
