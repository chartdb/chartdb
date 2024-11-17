import type { LanguageMetadata, LanguageTranslation } from '../types';

export const mr: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'फाइल',
                new: 'नवीन',
                open: 'उघडा',
                save: 'जतन करा',
                import_database: 'डेटाबेस इम्पोर्ट करा',
                export_sql: 'SQL एक्स्पोर्ट करा',
                export_as: 'म्हणून एक्स्पोर्ट करा',
                delete_diagram: 'आरेख हटवा',
                exit: 'बाहेर पडा',
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
                zoom_on_scroll: 'स्क्रोलवर झूम करा',
                theme: 'थीम',
                show_dependencies: 'डिपेंडेन्सि दाखवा',
                hide_dependencies: 'डिपेंडेन्सि लपवा',
            },
            share: {
                // TODO: Add translations
                share: 'Share',
                export_diagram: 'Export Diagram',
                import_diagram: 'Import Diagram',
            },
            help: {
                help: 'मदत',
                visit_website: 'ChartDB ला भेट द्या',
                join_discord: 'आमच्या डिस्कॉर्डमध्ये सामील व्हा',
                schedule_a_call: 'आमच्याशी बोला!',
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
            title: 'आरेख पुनःक्रमित करा',
            description:
                'ही क्रिया आरेखातील सर्व टेबल्सची पुनर्रचना करेल. तुम्हाला पुढे जायचे आहे का?',
            reorder: 'पुनःक्रमित करा',
            cancel: 'रद्द करा',
        },

        multiple_schemas_alert: {
            title: 'एकाधिक स्कीमा',
            description:
                '{{schemasCount}} स्कीमा या आरेखात आहेत. सध्या दाखवत आहोत: {{formattedSchemas}}.',
            dont_show_again: 'पुन्हा दाखवू नका',
            change_schema: 'बदला',
            none: 'काहीही नाही',
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
        diagrams: 'आरेख',
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
            schema: 'स्कीमा:',
            filter_by_schema: 'स्कीमा द्वारे फिल्टर करा',
            search_schema: 'स्कीमा शोधा...',
            no_schemas_found: 'कोणतेही स्कीमा सापडले नाहीत.',
            view_all_options: 'सर्व पर्याय पहा...',
            tables_section: {
                tables: 'टेबल्स',
                add_table: 'टेबल जोडा',
                filter: 'फिल्टर',
                collapse: 'सर्व संकुचित करा',

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
                        comments: 'टिप्पण्या',
                        no_comments: 'कोणत्याही टिप्पणी नाहीत',
                        delete_field: 'फील्ड हटवा',
                    },
                    index_actions: {
                        title: 'इंडेक्स गुणधर्म',
                        name: 'नाव',
                        unique: 'युनिक',
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
            relationships_section: {
                relationships: 'रिलेशनशिप',
                filter: 'फिल्टर',
                add_relationship: 'रिलेशनशिप जोडा',
                collapse: 'सर्व संकुचित करा',
                relationship: {
                    primary: 'प्राथमिक टेबल',
                    foreign: 'रेफरंस टेबल',
                    cardinality: 'कार्डिनॅलिटी',
                    delete_relationship: 'हटवा',
                    relationship_actions: {
                        title: 'क्रिया',
                        delete_relationship: 'हटवा',
                    },
                },
                empty_state: {
                    title: 'कोणतेही रिलेशनशिप नाहीत',
                    description:
                        'टेबल्स कनेक्ट करण्यासाठी एक रिलेशनशिप तयार करा',
                },
            },
            dependencies_section: {
                dependencies: 'डिपेंडेन्सि',
                filter: 'फिल्टर',
                collapse: 'सर्व संकुचित करा',
                dependency: {
                    table: 'टेबल',
                    dependent_table: 'डिपेंडेन्सि दृश्य',
                    delete_dependency: 'हटवा',
                    dependency_actions: {
                        title: 'क्रिया',
                        delete_dependency: 'हटवा',
                    },
                },
                empty_state: {
                    title: 'कोणत्याही डिपेंडेन्सि नाहीत',
                    description: 'सुरू करण्यासाठी एक दृश्य तयार करा',
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
            reorder_diagram: 'आरेख पुनःक्रमित करा',
            highlight_overlapping_tables: 'ओव्हरलॅपिंग टेबल्स हायलाइट करा',
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
                step_2: 'स्क्रिप्टचा परिणाम येथे पेस्ट करा:',
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
            empty_diagram: 'रिक्त आरेख',
            continue: 'सुरू ठेवा',
            import: 'आयात करा',
        },

        open_diagram_dialog: {
            title: 'आरेख उघडा',
            description: 'खालील यादीतून उघडण्यासाठी एक आरेख निवडा.',
            table_columns: {
                name: 'नाव',
                created_at: 'तयार केले',
                last_modified: 'शेवटचे बदलले',
                tables_count: 'टेबल्स',
            },
            cancel: 'रद्द करा',
            open: 'उघडा',
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
                    'The diagram JSON is invalid. Please check the JSON and try again. Need help? chartdb.io@gmail.com',
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
            new_relationship: 'नवीन रिलेशनशिप',
        },

        table_node_context_menu: {
            edit_table: 'टेबल संपादित करा',
            delete_table: 'टेबल हटवा',
            // TODO: Add translations
            duplicate_table: 'Duplicate Table',
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
    },
};

export const mrMetadata: LanguageMetadata = {
    name: 'Marathi',
    nativeName: 'मराठी',
    code: 'mr',
};
