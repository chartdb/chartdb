import type { LanguageMetadata, LanguageTranslation } from '../types';

export const hi: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'नया',
            browse: 'ब्राउज़',
            tables: 'टेबल',
            refs: 'रेफ्स',
            areas: 'क्षेत्र',
            dependencies: 'निर्भरताएं',
            custom_types: 'कस्टम टाइप',
        },
        menu: {
            actions: {
                actions: 'कार्य',
                new: 'नया...',
                browse: 'ब्राउज़ करें...',
                save: 'सहेजें',
                import: 'डेटाबेस आयात करें',
                export_sql: 'SQL निर्यात करें',
                export_as: 'के रूप में निर्यात करें',
                delete_diagram: 'हटाएँ',
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
                hide_field_attributes: 'फ़ील्ड विशेषताएँ छिपाएँ',
                show_field_attributes: 'फ़ील्ड विशेषताएँ दिखाएँ',
                zoom_on_scroll: 'स्क्रॉल पर ज़ूम',
                show_views: 'डेटाबेस व्यू',
                theme: 'थीम',
                show_dependencies: 'निर्भरता दिखाएँ',
                hide_dependencies: 'निर्भरता छिपाएँ',
                show_minimap: 'मिनी मानचित्र दिखाएं',
                hide_minimap: 'मिनी मानचित्र छिपाएं',
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
            title: 'आरेख स्वचालित व्यवस्थित करें',
            description:
                'यह क्रिया आरेख में सभी तालिकाओं को पुनः व्यवस्थित कर देगी। क्या आप जारी रखना चाहते हैं?',
            reorder: 'स्वचालित व्यवस्थित करें',
            cancel: 'रद्द करें',
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
        copy_to_clipboard: 'Copy to Clipboard',
        copied: 'Copied!',

        share_table_dialog: {
            title: 'शेयर सारणी',
            description:
                'इस तालिका को साझा करने के लिए नीचे दिए गए लिंक को कॉपी करें।',
            close: 'बंद करना',
        },

        side_panel: {
            view_all_options: 'सभी विकल्प देखें...',
            tables_section: {
                tables: 'तालिकाएँ',
                add_table: 'तालिका जोड़ें',
                add_view: 'व्यू जोड़ें',
                filter: 'फ़िल्टर',
                collapse: 'सभी को संक्षिप्त करें',
                clear: 'स्पष्ट फ़िल्टर',
                no_results: 'कोई भी टेबल आपके फ़िल्टर से मेल नहीं पाया।',
                show_list: 'तालिका सूची दिखाएं',
                show_dbml: 'DBML संपादक दिखाएं',

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
                        auto_increment: 'ऑटो इंक्रीमेंट',
                        comments: 'टिप्पणियाँ',
                        no_comments: 'कोई टिप्पणी नहीं',
                        delete_field: 'फ़ील्ड हटाएँ',
                        default_value: 'Default Value',
                        no_default: 'No default',
                        character_length: 'Max Length',
                        precision: 'Precision',
                        scale: 'Scale',
                    },
                    index_actions: {
                        title: 'सूचकांक विशेषताएँ',
                        name: 'नाम',
                        unique: 'अद्वितीय',
                        index_type: 'इंडेक्स प्रकार',
                        delete_index: 'सूचकांक हटाएँ',
                    },
                    table_actions: {
                        title: 'तालिका क्रियाएँ',
                        change_schema: 'स्कीमा बदलें',
                        add_field: 'फ़ील्ड जोड़ें',
                        add_index: 'सूचकांक जोड़ें',
                        duplicate_table: 'डुप्लिकेट टेबल',
                        delete_table: 'तालिका हटाएँ',
                    },
                },
                empty_state: {
                    title: 'कोई तालिकाएँ नहीं',
                    description: 'शुरू करने के लिए एक तालिका बनाएँ',
                },
            },
            refs_section: {
                refs: 'रेफ्स',
                filter: 'फ़िल्टर',
                collapse: 'सभी को संक्षिप्त करें',
                add_relationship: 'संबंध जोड़ें',
                relationships: 'संबंध',
                dependencies: 'निर्भरताएँ',
                relationship: {
                    relationship: 'संबंध',
                    primary: 'प्राथमिक तालिका',
                    foreign: 'संदर्भित तालिका',
                    cardinality: 'कार्डिनैलिटी',
                    delete_relationship: 'हटाएँ',
                    relationship_actions: {
                        title: 'क्रियाएँ',
                        delete_relationship: 'हटाएँ',
                    },
                },
                dependency: {
                    dependency: 'निर्भरता',
                    table: 'तालिका',
                    dependent_table: 'आश्रित दृश्य',
                    delete_dependency: 'हटाएँ',
                    dependency_actions: {
                        title: 'क्रियाएँ',
                        delete_dependency: 'हटाएँ',
                    },
                },
                empty_state: {
                    title: 'कोई संबंध नहीं',
                    description: 'शुरू करने के लिए एक संबंध बनाएँ',
                },
            },
            areas_section: {
                areas: 'क्षेत्रों',
                add_area: 'क्षेत्र जोड़ें',
                filter: 'फ़िल्टर',
                clear: 'स्पष्ट फ़िल्टर',
                no_results: 'कोई भी क्षेत्र आपके फ़िल्टर से मेल नहीं खाता।',

                area: {
                    area_actions: {
                        title: 'क्षेत्र कार्य',
                        edit_name: 'नाम संपादित करें',
                        delete_area: 'क्षेत्र हटाएं',
                    },
                },
                empty_state: {
                    title: 'कोई क्षेत्र नहीं',
                    description: 'आरंभ करने के लिए एक क्षेत्र बनाएं',
                },
            },
            custom_types_section: {
                custom_types: 'कस्टम प्रकार',
                filter: 'फ़िल्टर',
                clear: 'स्पष्ट फ़िल्टर',
                no_results: 'कोई कस्टम प्रकार आपके फ़िल्टर से मेल नहीं खाता।',
                empty_state: {
                    title: 'कोई कस्टम प्रकार नहीं',
                    description:
                        'कस्टम प्रकार यहां दिखाई देंगे जब वे आपके डेटाबेस में उपलब्ध होंगे',
                },
                custom_type: {
                    kind: 'दयालु',
                    enum_values: 'मूल मान',
                    composite_fields: 'फील्ड्स',
                    no_fields: 'कोई फ़ील्ड परिभाषित नहीं',
                    no_values: 'कोई enum मान परिभाषित नहीं',
                    field_name_placeholder: 'क्षेत्र नाम',
                    field_type_placeholder: 'प्रकार का चयन करें',
                    add_field: 'क्षेत्र जोड़ें',
                    no_fields_tooltip:
                        'इस कस्टम प्रकार के लिए कोई फ़ील्ड परिभाषित नहीं है',
                    custom_type_actions: {
                        title: 'कार्रवाई',
                        highlight_fields: 'फील्ड हाइलाइट करें',
                        delete_custom_type: 'मिटाना',
                        clear_field_highlight: 'स्पष्ट मुख्य आकर्षण',
                    },
                    delete_custom_type: 'हटाएं प्रकार',
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
            reorder_diagram: 'आरेख स्वचालित व्यवस्थित करें',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'ओवरलैपिंग तालिकाओं को हाइलाइट करें',
            filter: 'Filter Tables',
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
                step_2: 'यहाँ स्क्रिप्ट का परिणाम पेस्ट करें →',
                script_results_placeholder: 'स्क्रिप्ट के परिणाम यहाँ...',
                ssms_instructions: {
                    button_text: 'SSMS निर्देश',
                    title: 'निर्देश',
                    step_1: 'टूल्स > ऑप्शंस > क्वेरी परिणाम > SQL सर्वर पर जाएँ।',
                    step_2: 'यदि आप "ग्रिड में परिणाम" का उपयोग कर रहे हैं, तो Non-XML डेटा के लिए अधिकतम वर्ण प्राप्ति (9999999 पर सेट करें)।',
                },
                instructions_link: 'मदद चाहिए? देखें कैसे',
                check_script_result: 'Check Script Result',
            },

            cancel: 'रद्द करें',
            back: 'वापस',
            import_from_file: 'Import from File',
            empty_diagram: 'खाली आरेख',
            continue: 'जारी रखें',
            import: 'आयात करें',
        },

        open_diagram_dialog: {
            title: 'डेटाबेस खोलें',
            description: 'नीचे दी गई सूची से एक आरेख चुनें।',
            table_columns: {
                name: 'नाम',
                created_at: 'निर्माण तिथि',
                last_modified: 'अंतिम संशोधन',
                tables_count: 'तालिकाएँ',
            },
            cancel: 'रद्द करें',
            start_new: 'एक नए आरेख से शुरू करें',
            open: 'खोलें',

            diagram_actions: {
                open: 'खोलें',
                duplicate: 'डुप्लिकेट',
                delete: 'हटाएं',
            },
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

        create_table_schema_dialog: {
            title: 'नया स्कीमा बनाएं',
            description:
                'अभी तक कोई स्कीमा मौजूद नहीं है। अपनी तालिकाओं को व्यवस्थित करने के लिए अपना पहला स्कीमा बनाएं।',
            create: 'बनाएं',
            cancel: 'रद्द करें',
        },

        star_us_dialog: {
            title: 'हमें सुधारने में मदद करें!',
            description:
                'क्या आप हमें GitHub पर स्टार देना चाहेंगे? यह बस एक क्लिक की दूरी पर है!',
            close: 'अभी नहीं',
            confirm: 'बिलकुल!',
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
            title: 'आयात आरेख',
            description: 'Paste the diagram JSON below:',
            cancel: 'Cancel',
            import: 'Import',
            error: {
                title: 'त्रुटि आयात आरेख',
                description: 'आरेख JSON अमान्य है। ',
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
            new_view: 'नया व्यू',
            new_relationship: 'नया संबंध',
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'तालिका संपादित करें',
            duplicate_table: 'डुप्लिकेट टेबल',
            delete_table: 'तालिका हटाएँ',
            add_relationship: 'संबंध जोड़ें',
        },
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'संपादित करने के लिए डबल-क्लिक करें',
        },

        language_select: {
            change_language: 'भाषा बदलें',
        },

        on: 'चालू',
        off: 'बंद',
    },
};

export const hiMetadata: LanguageMetadata = {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    code: 'hi',
};
