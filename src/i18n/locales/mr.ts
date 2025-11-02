import type { LanguageMetadata, LanguageTranslation } from '../types';

export const mr: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'नवीन',
            browse: 'ब्राउज',
            tables: 'टेबल',
            refs: 'Refs',
            dependencies: 'अवलंबने',
            custom_types: 'कस्टम प्रकार',
            visuals: 'Visuals',
        },
        menu: {
            actions: {
                actions: 'क्रिया',
                new: 'नवीन...',
                browse: 'ब्राउज करा...',
                save: 'जतन करा',
                import: 'डेटाबेस इम्पोर्ट करा',
                export_sql: 'SQL एक्स्पोर्ट करा',
                export_as: 'म्हणून एक्स्पोर्ट करा',
                delete_diagram: 'हटवा',
            },
            edit: {
                edit: 'संपादन करा',
                undo: 'पूर्ववत करा',
                redo: 'पुन्हा करा',
                clear: 'साफ करा',
            },
            view: {
                view: 'दृश्य',
                show_sidebar: 'साइडबार दाखवा',
                hide_sidebar: 'साइडबार लपवा',
                hide_cardinality: 'कार्डिनॅलिटी लपवा',
                show_cardinality: 'कार्डिनॅलिटी दाखवा',
                hide_field_attributes: 'फील्ड गुणधर्म लपवा',
                show_field_attributes: 'फील्ड गुणधर्म दाखवा',
                zoom_on_scroll: 'स्क्रोलवर झूम करा',
                show_views: 'डेटाबेस व्ह्यूज',
                theme: 'थीम',
                show_dependencies: 'डिपेंडेन्सि दाखवा',
                hide_dependencies: 'डिपेंडेन्सि लपवा',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                // TODO: Add translations
                backup: 'Backup',
                export_diagram: 'Export Diagram',
                restore_diagram: 'Restore Diagram',
            },
            help: {
                help: 'मदत',
                docs_website: 'दस्तऐवजीकरण',
                join_discord: 'आमच्या डिस्कॉर्डमध्ये सामील व्हा',
            },
        },

        delete_diagram_alert: {
            title: 'आरेख हटवा',
            description:
                'ही क्रिया पूर्ववत केली जाऊ शकत नाही. हे आरेख कायमचे हटवेल.',
            cancel: 'रद्द करा',
            delete: 'हटवा',
        },

        clear_diagram_alert: {
            title: 'आरेख साफ करा',
            description:
                'ही क्रिया पूर्ववत केली जाऊ शकत नाही. हे आरेखातील सर्व डेटा कायमचे हटवेल.',
            cancel: 'रद्द करा',
            clear: 'साफ करा',
        },

        reorder_diagram_alert: {
            title: 'आरेख स्वयंचलित व्यवस्थित करा',
            description:
                'ही क्रिया आरेखातील सर्व टेबल्सची पुनर्रचना करेल. तुम्हाला पुढे जायचे आहे का?',
            reorder: 'स्वयंचलित व्यवस्थित करा',
            cancel: 'रद्द करा',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'कॉपी अयशस्वी',
                description: 'क्लिपबोर्ड समर्थित नाही',
            },
            failed: {
                title: 'कॉपी अयशस्वी',
                description: 'काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.',
            },
        },

        theme: {
            system: 'सिस्टम',
            light: 'लाईट',
            dark: 'डार्क',
        },

        zoom: {
            on: 'चालू',
            off: 'बंद',
        },

        last_saved: 'शेवटचे जतन केले',
        saved: 'जतन केले',
        loading_diagram: 'आरेख लोड करत आहे...',
        deselect_all: 'सर्व निवड रद्द करा',
        select_all: 'सर्व निवडा',
        clear: 'साफ करा',
        show_more: 'अधिक दाखवा',
        show_less: 'कमी दाखवा',
        // TODO: Add translations
        copy_to_clipboard: 'Copy to Clipboard',
        // TODO: Add translations
        copied: 'Copied!',

        side_panel: {
            view_all_options: 'सर्व पर्याय पहा...',
            tables_section: {
                tables: 'टेबल्स',
                add_table: 'टेबल जोडा',
                add_view: 'व्ह्यू जोडा',
                filter: 'फिल्टर',
                collapse: 'सर्व संकुचित करा',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'फील्ड्स',
                    nullable: 'नल करण्यायोग्य?',
                    primary_key: 'प्राथमिक की',
                    indexes: 'सूचकांक',
                    comments: 'टिप्पण्या',
                    no_comments: 'कोणत्याही टिप्पणी नाहीत',
                    add_field: 'फील्ड जोडा',
                    add_index: 'सूचकांक जोडा',
                    index_select_fields: 'फील्ड निवडा',
                    no_types_found: 'कोणतेही प्रकार सापडले नाहीत',
                    field_name: 'नाव',
                    field_type: 'प्रकार',
                    field_actions: {
                        title: 'फील्ड गुणधर्म',
                        unique: 'युनिक',
                        auto_increment: 'ऑटो इंक्रिमेंट',
                        comments: 'टिप्पण्या',
                        no_comments: 'कोणत्याही टिप्पणी नाहीत',
                        delete_field: 'फील्ड हटवा',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'अचूकता',
                        scale: 'प्रमाण',
                    },
                    index_actions: {
                        title: 'इंडेक्स गुणधर्म',
                        name: 'नाव',
                        unique: 'युनिक',
                        index_type: 'इंडेक्स प्रकार',
                        delete_index: 'इंडेक्स हटवा',
                    },
                    table_actions: {
                        title: 'टेबल एक्शन',
                        change_schema: 'स्कीमा बदला',
                        add_field: 'फील्ड जोडा',
                        add_index: 'इंडेक्स जोडा',
                        delete_table: 'टेबल हटवा',
                        // TODO: Add translations
                        duplicate_table: 'Duplicate Table',
                    },
                },
                empty_state: {
                    title: 'कोणतेही टेबल नाहीत',
                    description: 'सुरू करण्यासाठी एक टेबल तयार करा',
                },
            },
            refs_section: {
                refs: 'Refs',
                filter: 'फिल्टर',
                collapse: 'सर्व संकुचित करा',
                add_relationship: 'रिलेशनशिप जोडा',
                relationships: 'रिलेशनशिप',
                dependencies: 'डिपेंडेन्सि',
                relationship: {
                    relationship: 'रिलेशनशिप',
                    primary: 'प्राथमिक टेबल',
                    foreign: 'रेफरंस टेबल',
                    cardinality: 'कार्डिनॅलिटी',
                    delete_relationship: 'हटवा',
                    relationship_actions: {
                        title: 'क्रिया',
                        delete_relationship: 'हटवा',
                    },
                },
                dependency: {
                    dependency: 'डिपेंडेन्सि',
                    table: 'टेबल',
                    dependent_table: 'डिपेंडेन्सि दृश्य',
                    delete_dependency: 'हटवा',
                    dependency_actions: {
                        title: 'क्रिया',
                        delete_dependency: 'हटवा',
                    },
                },
                empty_state: {
                    title: 'कोणतेही रिलेशनशिप नाहीत',
                    description: 'सुरू करण्यासाठी एक रिलेशनशिप तयार करा',
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
                    notes: 'नोट्स',
                },
            },

            notes_section: {
                filter: 'फिल्टर',
                add_note: 'नोट जोडा',
                no_results: 'कोणत्याही नोट्स सापडल्या नाहीत',
                clear: 'फिल्टर साफ करा',
                empty_state: {
                    title: 'नोट्स नाहीत',
                    description:
                        'कॅनव्हासवर मजकूर भाष्य जोडण्यासाठी एक नोट तयार करा',
                },
                note: {
                    empty_note: 'रिकामी नोट',
                    note_actions: {
                        title: 'नोट क्रिया',
                        edit_content: 'सामग्री संपादित करा',
                        delete_note: 'नोट हटवा',
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
                    no_values: 'कोणतीही enum मूल्ये परिभाषित नाहीत',
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
            zoom_in: 'झूम इन',
            zoom_out: 'झूम आउट',
            save: 'जतन करा',
            show_all: 'सर्व दाखवा',
            undo: 'पूर्ववत करा',
            redo: 'पुन्हा करा',
            reorder_diagram: 'आरेख स्वयंचलित व्यवस्थित करा',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'ओव्हरलॅपिंग टेबल्स हायलाइट करा',
            // TODO: Translate
            filter: 'Filter Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'तुमचा डेटाबेस कोणता आहे?',
                description:
                    'प्रत्येक डेटाबेसचे स्वतःचे युनिक वैशिष्ट्ये आणि क्षमता आहेत.',
                check_examples_long: 'उदाहरणे तपासा',
                check_examples_short: 'उदाहरणे',
            },

            import_database: {
                title: 'तुमचा डेटाबेस आयात करा',
                database_edition: 'डेटाबेस संस्करण:',
                step_1: 'तुमच्या डेटाबेसमध्ये हा स्क्रिप्ट चालवा:',
                step_2: 'स्क्रिप्टचा परिणाम येथे पेस्ट करा →',
                script_results_placeholder: 'स्क्रिप्ट परिणाम येथे...',
                ssms_instructions: {
                    button_text: 'SSMS सूचना',
                    title: 'सूचना',
                    step_1: 'टूल्स > पर्याय > क्वेरी परिणाम > SQL सर्व्हर वर जा.',
                    step_2: 'जर तुम्ही "ग्रिडला परिणाम" वापरत असाल, तर नॉन-XML डेटासाठी जास्तीत जास्त वर्ण पुनर्प्राप्ती बदला (9999999 वर सेट करा).',
                },
                // TODO: Add translations
                instructions_link: 'Need help? Watch how',
                check_script_result: 'Check Script Result',
            },

            cancel: 'रद्द करा',
            // TODO: Add translations
            import_from_file: 'Import from File',
            back: 'मागे',
            empty_diagram: 'रिक्त डेटाबेस',
            continue: 'सुरू ठेवा',
            import: 'आयात करा',
        },

        open_diagram_dialog: {
            title: 'डेटाबेस उघडा',
            description: 'खालील यादीतून उघडण्यासाठी एक आरेख निवडा.',
            table_columns: {
                name: 'नाव',
                created_at: 'तयार केले',
                last_modified: 'शेवटचे बदलले',
                tables_count: 'टेबल्स',
            },
            cancel: 'रद्द करा',
            open: 'उघडा',

            diagram_actions: {
                open: 'उघडा',
                duplicate: 'डुप्लिकेट',
                delete: 'हटवा',
            },
        },

        export_sql_dialog: {
            title: 'SQL निर्यात करा',
            description:
                'तुमच्या आरेख स्कीमाला {{databaseType}} स्क्रिप्टमध्ये निर्यात करा',
            close: 'बंद करा',
            loading: {
                text: 'AI {{databaseType}} साठी SQL तयार करत आहे...',
                description: 'याला 30 सेकंद लागतील.',
            },
            error: {
                message:
                    'SQL स्क्रिप्ट तयार करताना एरर. कृपया नंतर पुन्हा प्रयत्न करा किंवा <0>आमच्याशी संपर्क साधा</0>.',
                description:
                    'तुमचा OPENAI_TOKEN वापरण्यास मोकळे रहा, मॅन्युअल <0>येथे</0> पहा.',
            },
        },

        create_relationship_dialog: {
            title: 'रिलेशनशिप तयार करा',
            primary_table: 'प्राथमिक टेबल',
            primary_field: 'रेफरन्स फील्ड',
            referenced_table: 'रेफरन्स टेबल',
            referenced_field: 'रेफरन्स फील्ड',
            primary_table_placeholder: 'टेबल निवडा',
            primary_field_placeholder: 'फील्ड निवडा',
            referenced_table_placeholder: 'टेबल निवडा',
            referenced_field_placeholder: 'फील्ड निवडा',
            no_tables_found: 'कोणतेही टेबल सापडले नाहीत',
            no_fields_found: 'कोणतेही फील्ड सापडले नाहीत',
            create: 'तयार करा',
            cancel: 'रद्द करा',
        },

        import_database_dialog: {
            title: 'सध्याच्या आरेखात आयात करा',
            override_alert: {
                title: 'डेटाबेस आयात करा',
                content: {
                    alert: 'हा आरेख आयात केल्याने सध्याचे टेबल्स आणि रिलेशनशिप वर फरक पडेल.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> नवीन टेबल्स जोडले जातील.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> नवीन रिलेशनशिप तयार केले जातील.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> टेबल्स अधिलिखित केले जातील.',
                    proceed: 'तुम्हाला पुढे जायचे आहे का?',
                },
                import: 'आयात करा',
                cancel: 'रद्द करा',
            },
        },

        export_image_dialog: {
            title: 'इमेज निर्यात करा',
            description: 'एक्स्पोर्ट करण्यासाठी स्केल फॅक्टर निवडा:',
            scale_1x: '1x नियमित',
            scale_2x: '2x (शिफारस केलेले)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'रद्द करा',
            export: 'निर्यात करा',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'स्कीमा निवडा',
            description:
                'सध्या एकाधिक स्कीमा प्रदर्शित आहेत. नवीन टेबलसाठी एक निवडा.',
            cancel: 'रद्द करा',
            confirm: 'पुष्टी करा',
        },

        update_table_schema_dialog: {
            title: 'स्कीमा बदला',
            description: 'टेबल "{{tableName}}" स्कीमा अपडेट करा',
            cancel: 'रद्द करा',
            confirm: 'बदला',
        },

        create_table_schema_dialog: {
            title: 'नवीन स्कीमा तयार करा',
            description:
                'अजून कोणतीही स्कीमा अस्तित्वात नाही. आपल्या टेबल्स व्यवस्थित करण्यासाठी आपली पहिली स्कीमा तयार करा.',
            create: 'तयार करा',
            cancel: 'रद्द करा',
        },

        star_us_dialog: {
            title: 'आम्हाला सुधारण्यास मदत करा!',
            description:
                'तुम्हाला GitHub वर आम्हाला स्टार करायचे आहे का? हे फक्त एक क्लिक दूर आहे!',
            close: 'आता नाही',
            confirm: 'नक्कीच!',
        },

        // TODO: Add translations
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

        // TO
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
            one_to_one: 'एक ते एक',
            one_to_many: 'एक ते अनेक',
            many_to_one: 'अनेक ते एक',
            many_to_many: 'अनेक ते अनेक',
        },

        canvas_context_menu: {
            new_table: 'नवीन टेबल',
            new_view: 'नवीन व्ह्यू',
            new_relationship: 'नवीन रिलेशनशिप',
            // TODO: Translate
            new_area: 'New Area',
            new_note: 'नवीन टीप',
        },

        table_node_context_menu: {
            edit_table: 'टेबल संपादित करा',
            delete_table: 'टेबल हटवा',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        // TODO: Add translations
        tool_tips: {
            double_click_to_edit: 'Double-click to edit',
        },

        language_select: {
            change_language: 'भाषा बदला',
        },

        on: 'चालू',
        off: 'बंद',
    },
};

export const mrMetadata: LanguageMetadata = {
    name: 'Marathi',
    nativeName: 'मराठी',
    code: 'mr',
};
