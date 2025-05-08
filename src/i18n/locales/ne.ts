import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ne: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'फाइल',
                new: 'नयाँ',
                open: 'खोल्नुहोस्',
                save: 'सुरक्षित गर्नुहोस्',
                import: 'डाटाबेस आयात गर्नुहोस्',
                export_sql: 'SQL निर्यात गर्नुहोस्',
                export_as: 'निर्यात गर्नुहोस्',
                delete_diagram: 'डायाग्राम हटाउनुहोस्',
                exit: 'बाहिर निस्कनुहोस्',
            },
            edit: {
                edit: 'सम्पादन',
                undo: 'पूर्ववत',
                redo: 'पुनः गर्नुहोस्',
                clear: 'स्पष्ट',
            },
            view: {
                view: 'हेर्नुहोस्',
                show_sidebar: 'साइडबार देखाउनुहोस्',
                hide_sidebar: 'साइडबार लुकाउनुहोस्',
                hide_cardinality: 'कार्डिन्यालिटी लुकाउनुहोस्',
                show_cardinality: 'कार्डिन्यालिटी देखाउनुहोस्',
                zoom_on_scroll: 'स्क्रोलमा जुम गर्नुहोस्',
                theme: 'थिम',
                show_dependencies: 'डिपेन्डेन्सीहरू देखाउनुहोस्',
                hide_dependencies: 'डिपेन्डेन्सीहरू लुकाउनुहोस्',
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
                help: 'मद्दत',
                docs_website: 'कागजात',
                join_discord: 'डिस्कोर्डमा सामिल हुनुहोस्',
            },
        },

        delete_diagram_alert: {
            title: 'डायाग्राम हटाउनुहोस्',
            description:
                'यो कार्य पूर्ववत गर्न सकिँदैन। यो डायाग्राम स्थायी रूपमा हटाउनेछ।',
            cancel: 'रद्द गर्नुहोस्',
            delete: 'हटाउनुहोस्',
        },

        clear_diagram_alert: {
            title: 'डायाग्राम स्पष्ट गर्नुहोस्',
            description:
                'यो कार्य पूर्ववत गर्न सकिँदैन। यो डायाग्राम स्थायी रूपमा हटाउनेछ।',
            cancel: 'रद्द गर्नुहोस्',
            clear: 'स्पष्ट गर्नुहोस्',
        },

        reorder_diagram_alert: {
            title: 'डायाग्राम पुनः क्रमबद्ध गर्नुहोस्',
            description:
                'यो कार्य पूर्ववत गर्न सकिँदैन। यो डायाग्राम स्थायी रूपमा हटाउनेछ।',
            reorder: 'पुनः क्रमबद्ध गर्नुहोस्',
            cancel: 'रद्द गर्नुहोस्',
        },

        multiple_schemas_alert: {
            title: 'विविध स्कीमहरू',
            description:
                '{{schemasCount}} डायाग्राममा स्कीमहरू। हालको रूपमा देखाइएको छ: {{formattedSchemas}}।',
            dont_show_again: 'फेरि देखाउन नदिनुहोस्',
            change_schema: 'स्कीम परिवर्तन गर्नुहोस्',
            none: 'कुनै पनि छैन',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'प्रतिलिपि असफल',
                description: 'क्लिपबोर्ड समर्थित छैन',
            },
            failed: {
                title: 'प्रतिलिपि असफल',
                description: 'केही गडबड भयो। कृपया फेरि प्रयास गर्नुहोस्।',
            },
        },

        theme: {
            system: 'सिस्टम',
            light: 'लाइट',
            dark: 'डार्क',
        },

        zoom: {
            on: 'चालू',
            off: 'बन्द',
        },

        last_saved: 'अन्तिम सुरक्षित',
        saved: 'सुरक्षित',
        loading_diagram: 'डायाग्राम लोड हुँदैछ...',
        deselect_all: 'सबै चयन हटाउनुहोस्',
        select_all: 'सबै चयन गर्नुहोस्',
        clear: 'स्पष्ट',
        show_more: 'थप देखाउनुहोस्',
        show_less: 'कम देखाउनुहोस्',
        copy_to_clipboard: 'क्लिपबोर्डमा प्रतिलिपि गर्नुहोस्',
        copied: 'प्रतिलिपि गरियो!',

        side_panel: {
            schema: 'स्कीम:',
            filter_by_schema: 'स्कीम अनुसार फिल्टर गर्नुहोस्',
            search_schema: 'स्कीम खोज्नुहोस्...',
            no_schemas_found: 'कुनै स्कीमहरू फेला परेनन्',
            view_all_options: 'सबै विकल्पहरू हेर्नुहोस्',
            tables_section: {
                tables: 'तालिकाहरू',
                add_table: 'तालिका थप्नुहोस्',
                filter: 'फिल्टर',
                collapse: 'सबै लुकाउनुहोस्',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'क्षेत्रहरू',
                    nullable: 'नलेबल?',
                    primary_key: 'प्राथमिक कुंजी',
                    indexes: 'सूचकहरू',
                    comments: 'टिप्पणीहरू',
                    no_comments: 'कुनै टिप्पणीहरू छैनन्',
                    add_field: 'क्षेत्र थप्नुहोस्',
                    add_index: 'सूचक थप्नुहोस्',
                    index_select_fields: 'क्षेत्रहरू चयन गर्नुहोस्',
                    no_types_found: 'कुनै प्रकारहरू फेला परेनन्',
                    field_name: 'नाम',
                    field_type: 'प्रकार',
                    field_actions: {
                        title: 'क्षेत्र विशेषताहरू',
                        unique: 'अनन्य',
                        comments: 'टिप्पणीहरू',
                        no_comments: 'कुनै टिप्पणीहरू छैनन्',
                        delete_field: 'क्षेत्र हटाउनुहोस्',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'सूचक विशेषताहरू',
                        name: 'नाम',
                        unique: 'अनन्य',
                        delete_index: 'सूचक हटाउनुहोस्',
                    },
                    table_actions: {
                        title: 'तालिका विशेषताहरू',
                        change_schema: 'स्कीम परिवर्तन गर्नुहोस्',
                        add_field: 'क्षेत्र थप्नुहोस्',
                        add_index: 'सूचक थप्नुहोस्',
                        duplicate_table: 'तालिकाको नक्कली रुप बनाउनुहोस',
                        delete_table: 'तालिका हटाउनुहोस्',
                    },
                },
                empty_state: {
                    title: 'कुनै तालिकाहरू छैनन्',
                    description: 'सुरु गर्नका लागि एक तालिका बनाउनुहोस्',
                },
            },
            relationships_section: {
                relationships: 'सम्बन्धहरू',
                filter: 'फिल्टर',
                add_relationship: 'सम्बन्ध थप्नुहोस्',
                collapse: 'सबै लुकाउनुहोस्',
                relationship: {
                    primary: 'मुख्य तालिका',
                    foreign: 'परिचित तालिका',
                    cardinality: 'कार्डिन्यालिटी',
                    delete_relationship: 'हटाउनुहोस्',
                    relationship_actions: {
                        title: 'कार्यहरू',
                        delete_relationship: 'हटाउनुहोस्',
                    },
                },
                empty_state: {
                    title: 'कुनै सम्बन्धहरू छैनन्',
                    description: 'तालिकाहरू जोड्नका लागि एक सम्बन्ध बनाउनुहोस्',
                },
            },
            dependencies_section: {
                dependencies: 'डिपेन्डेन्सीहरू',
                filter: 'फिल्टर',
                collapse: 'सबै लुकाउनुहोस्',
                dependency: {
                    table: 'तालिका',
                    dependent_table: 'विचलित तालिका',
                    delete_dependency: 'हटाउनुहोस्',
                    dependency_actions: {
                        title: 'कार्यहरू',
                        delete_dependency: 'हटाउनुहोस्',
                    },
                },
                empty_state: {
                    title: 'कुनै डिपेन्डेन्सीहरू छैनन्',
                    description:
                        'डिपेन्डेन्सीहरू देखाउनका लागि एक व्यू बनाउनुहोस्',
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
            zoom_in: 'जुम इन',
            zoom_out: 'जुम आउट',
            save: 'सुरक्षित गर्नुहोस्',
            show_all: 'सबै देखाउनुहोस्',
            undo: 'पूर्ववत',
            redo: 'पुनः गर्नुहोस्',
            reorder_diagram: 'पुनः क्रमबद्ध गर्नुहोस्',
            highlight_overlapping_tables:
                'अतिरिक्त तालिकाहरू हाइलाइट गर्नुहोस्',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'तपाईंको डाटाबेस के हो?',
                description:
                    'प्रत्येक डाटाबेसलाई आफ्नो विशेषता र क्षमताहरू छन्।',
                check_examples_long: 'उदाहरणहरू हेर्नुहोस्',
                check_examples_short: 'उदाहरणहरू',
            },

            import_database: {
                title: 'तपाईंको डाटाबेस आयात गर्नुहोस्',
                database_edition: 'डाटाबेस संस्करण:',
                step_1: 'तपाईंको डाटाबेसमा यो स्क्रिप्ट चलाउनुहोस्:',
                step_2: 'यो स्क्रिप्ट परिणाम यहाँ पेस्ट गर्नुहोस्:',
                script_results_placeholder: 'स्क्रिप्ट परिणाम यहाँ...',
                ssms_instructions: {
                    button_text: 'SSMS निर्देशन',
                    title: 'निर्देशन',
                    step_1: 'टुल्स > विकल्प > क्वेरी परिणाम > SQL सर्भरमा जानुहोस्।',
                    step_2: 'तपाईं "नतिजा ग्रिड" प्रयोग गरिरहेको छ भने, गैर-XML डाटाका लागि अधिकतम वर्णहरू प्राप्त गर्नका लागि परिणामहरू परिवर्तन गर्नुहोस् (९९९९९९९ मा सेट गर्नुहोस्)।',
                },
                instructions_link: 'मद्दत चाहिन्छ? हेर्नुहोस् कसरी',
                check_script_result: 'स्क्रिप्ट परिणाम जाँच गर्नुहोस्',
            },

            cancel: 'रद्द गर्नुहोस्',
            import_from_file: 'फाइलबाट आयात गर्नुहोस्',
            back: 'फर्क',
            empty_diagram: 'रिक्त डायाग्राम',
            continue: 'जारी राख्नुहोस्',
            import: 'आयात गर्नुहोस्',
        },

        open_diagram_dialog: {
            title: 'डायाग्राम खोल्नुहोस्',
            description:
                'तलको सूचीबाट खोल्नका लागि एक डायाग्राम चयन गर्नुहोस्।',
            table_columns: {
                name: 'नाम',
                created_at: 'मा सिर्जना',
                last_modified: 'अन्तिम परिवर्तन',
                tables_count: 'तालिकाहरू',
            },
            cancel: 'रद्द गर्नुहोस्',
            open: 'खोल्नुहोस्',
        },

        export_sql_dialog: {
            title: 'SQL निर्यात गर्नुहोस्',
            description:
                'तलको विकल्पहरूबाट तपाईंको डायाग्राम स्कीम निर्यात गर्नुहोस्।',
            close: 'बन्द गर्नुहोस्',
            loading: {
                text: 'AI ले {{databaseType}} को लागि SQL उत्पन्न गर्दैछ...',
                description: 'यो ३० सेकेण्डसम्म समय लिन्छ।',
            },
            error: {
                message:
                    'SQL स्क्रिप्ट उत्पन्न गर्नमा त्रुटि। कृपया पछि प्रयास गर्नुहोस् वा <0>हामीलाई सम्पर्क गर्नुहोस्</0>।',
                description:
                    'तपाईंले OPENAI_TOKEN प्रयोग गर्न सक्नुहुन्छ, यहाँ <0>यहाँ</0> म्यानुअल हेर्नुहोस्।',
            },
        },

        create_relationship_dialog: {
            title: 'सम्बन्ध बनाउनुहोस्',
            primary_table: 'मुख्य तालिका',
            primary_field: 'मुख्य क्षेत्र',
            referenced_table: 'संदर्भित तालिका',
            referenced_field: 'संदर्भित क्षेत्र',
            primary_table_placeholder: 'तालिका चयन गर्नुहोस्',
            primary_field_placeholder: 'क्षेत्र चयन गर्नुहोस्',
            referenced_table_placeholder: 'तालिका चयन गर्नुहोस्',
            referenced_field_placeholder: 'क्षेत्र चयन गर्नुहोस्',
            no_tables_found: 'कुनै तालिकाहरू फेला परेनन्',
            no_fields_found: 'कुनै क्षेत्रहरू फेला परेनन्',
            create: 'बनाउनुहोस्',
            cancel: 'रद्द गर्नुहोस्',
        },

        import_database_dialog: {
            title: 'डाटाबेस आयात गर्नुहोस्',
            override_alert: {
                title: 'डाटाबेस आयात गर्नुहोस्',
                content: {
                    alert: 'यो डायाग्राममा आयात गर्ने असर गर्नेछ।',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> नयाँ तालिकाहरू थपिनेछन्।',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> नयाँ सम्बन्धहरू बनाइनेछन्।',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> तालिकाहरू ओभरराइड गरिनेछन्।',
                    proceed: 'के तपाईं जारी गर्न चाहनुहुन्छ?',
                },
                import: 'आयात गर्नुहोस्',
                cancel: 'रद्द गर्नुहोस्',
            },
        },

        export_image_dialog: {
            title: 'इमेज निर्यात गर्नुहोस्',
            description: 'निर्यात गर्नका लागि गणना कारक छान्नुहोस्:',
            scale_1x: '१x सामान्य',
            scale_2x: '२x (सिफारिस गरिएको)',
            scale_3x: '३x',
            scale_4x: '४x',
            cancel: 'रद्द गर्नुहोस्',
            export: 'निर्यात गर्नुहोस्',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'स्कीम चयन गर्नुहोस्',
            description:
                'विभिन्न स्कीमहरू वर्तमानमा देखाइएको छन्। नयाँ तालिकाका लागि एक चयन गर्नुहोस्।',
            cancel: 'रद्द गर्नुहोस्',
            confirm: 'पुष्टि गर्नुहोस्',
        },

        update_table_schema_dialog: {
            title: 'स्कीम परिवर्तन गर्नुहोस्',
            description: 'तालिका "{{tableName}}" स्कीम अपडेट गर्नुहोस्',
            cancel: 'रद्द गर्नुहोस्',
            confirm: 'परिवर्तन गर्नुहोस्',
        },

        star_us_dialog: {
            title: 'हामीलाई अझ राम्रो हुन मदत गर्नुहोस!',
            description:
                'के तपाईं हामीलाई GitHub मा स्टार गर्न चाहनुहुन्छ? यो केवल एक क्लिक पर छ!',
            close: 'अहिले हैन',
            confirm: 'अवस्य!',
        },
        export_diagram_dialog: {
            title: 'डायाग्राम निर्यात गर्नुहोस्',
            description: 'निर्यात गर्नका लागि निर्यात फरम्याट छान्नुहोस:',
            format_json: 'JSON',
            cancel: 'रद्द गर्नुहोस्',
            export: 'निर्यात गर्नुहोस्',
            error: {
                title: 'Error exporting diagram',
                description:
                    'Something went wrong. Need help? support@chartdb.io',
            },
        },

        import_diagram_dialog: {
            title: 'डायाग्राम आयात गर्नुहोस्',
            description: 'डायाग्राम JSON डेटा पेस्ट गर्नुहोस:',
            cancel: 'रद्द गर्नुहोस्',
            import: 'आयात गर्नुहोस्',
            error: {
                title: 'डायाग्राम आयात गर्दा समस्या आयो',
                description:
                    'डायाग्राम JSON अमान्य छ। कृपया JSON जाँच गर्नुहोस् र पुन: प्रयास गर्नुहोस्। मद्दत चाहिन्छ? support@chartdb.io मा सम्पर्क गर्नुहोस्',
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
            one_to_one: 'एक देखि एक',
            one_to_many: 'एक देखि धेरै',
            many_to_one: 'धेरै देखि एक',
            many_to_many: 'धेरै देखि धेरै',
        },

        canvas_context_menu: {
            new_table: 'नयाँ तालिका',
            new_relationship: 'नयाँ सम्बन्ध',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'तालिका सम्पादन गर्नुहोस्',
            duplicate_table: 'तालिका नक्कली गर्नुहोस्',
            delete_table: 'तालिका हटाउनुहोस्',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: 'ग्रिडमा स्न्याप गर्नुहोस् ({{key}} थिच्नुहोस)',

        tool_tips: {
            double_click_to_edit: 'सम्पादन गर्नका लागि डबल क्लिक गर्नुहोस्',
        },

        language_select: {
            change_language: 'भाषा परिवर्तन गर्नुहोस्',
        },
    },
};

export const neMetadata: LanguageMetadata = {
    name: 'Nepali',
    nativeName: 'नेपाली',
    code: 'ne',
};
