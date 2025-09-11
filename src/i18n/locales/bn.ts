import type { LanguageMetadata, LanguageTranslation } from '../types';

export const bn: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'নতুন',
            browse: 'ব্রাউজ',
            tables: 'টেবিল',
            refs: 'রেফস',
            areas: 'এলাকা',
            dependencies: 'নির্ভরতা',
            custom_types: 'কাস্টম টাইপ',
        },
        menu: {
            actions: {
                actions: 'কার্য',
                new: 'নতুন...',
                browse: 'ব্রাউজ করুন...',
                save: 'সংরক্ষণ করুন',
                import: 'ডাটাবেস আমদানি করুন',
                export_sql: 'SQL রপ্তানি করুন',
                export_as: 'রূপে রপ্তানি করুন',
                delete_diagram: 'মুছুন',
            },
            edit: {
                edit: 'সম্পাদনা',
                undo: 'পূর্বাবস্থায় ফিরুন',
                redo: 'পুনরায় করুন',
                clear: 'পরিষ্কার করুন',
            },
            view: {
                view: 'দেখুন',
                show_sidebar: 'সাইডবার দেখান',
                hide_sidebar: 'সাইডবার লুকান',
                hide_cardinality: 'কার্ডিনালিটি লুকান',
                show_cardinality: 'কার্ডিনালিটি দেখান',
                hide_field_attributes: 'ফিল্ড অ্যাট্রিবিউট লুকান',
                show_field_attributes: 'ফিল্ড অ্যাট্রিবিউট দেখান',
                zoom_on_scroll: 'স্ক্রলে জুম করুন',
                show_views: 'ডাটাবেস ভিউ',
                theme: 'থিম',
                show_dependencies: 'নির্ভরতাগুলি দেখান',
                hide_dependencies: 'নির্ভরতাগুলি লুকান',
                show_minimap: 'মিনি মানচিত্র দেখান',
                hide_minimap: 'মিনি মানচিত্র লুকান',
            },

            backup: {
                backup: 'ব্যাকআপ',
                export_diagram: 'ডায়াগ্রাম রপ্তানি করুন',
                restore_diagram: 'ডায়াগ্রাম পুনরুদ্ধার করুন',
            },
            help: {
                help: 'সাহায্য',
                docs_website: 'ডকুমেন্টেশন',
                join_discord: 'আমাদের Discord-এ যোগ দিন',
            },
        },

        delete_diagram_alert: {
            title: 'ডায়াগ্রাম মুছুন',
            description:
                'এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না। এই ডায়াগ্রাম স্থায়ীভাবে মুছে ফেলা হবে।',
            cancel: 'বাতিল করুন',
            delete: 'মুছুন',
        },

        clear_diagram_alert: {
            title: 'ডায়াগ্রাম পরিষ্কার করুন',
            description:
                'এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না। এই ডায়াগ্রামের সমস্ত তথ্য স্থায়ীভাবে মুছে যাবে।',
            cancel: 'বাতিল করুন',
            clear: 'পরিষ্কার করুন',
        },

        reorder_diagram_alert: {
            title: 'স্বয়ংক্রিয় ডায়াগ্রাম সাজান',
            description:
                'এই কাজটি ডায়াগ্রামের সমস্ত টেবিল পুনর্বিন্যাস করবে। আপনি কি চালিয়ে যেতে চান?',
            reorder: 'স্বয়ংক্রিয় সাজান',
            cancel: 'বাতিল করুন',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'কপি ব্যর্থ হয়েছে',
                description: 'ক্লিপবোর্ড সমর্থিত নয়',
            },
            failed: {
                title: 'কপি ব্যর্থ হয়েছে',
                description: 'কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
            },
        },

        theme: {
            system: 'সিস্টেম',
            light: 'হালকা',
            dark: 'অন্ধকার',
        },

        zoom: {
            on: 'চালু',
            off: 'বন্ধ',
        },

        last_saved: 'সর্বশেষ সংরক্ষণ',
        saved: 'সংরক্ষিত',
        loading_diagram: 'ডায়াগ্রাম লোড হচ্ছে...',
        deselect_all: 'সব নির্বাচন সরান',
        select_all: 'সব নির্বাচন করুন',
        clear: 'পরিষ্কার করুন',
        show_more: 'আরও দেখুন',
        show_less: 'কম দেখুন',
        copy_to_clipboard: 'ক্লিপবোর্ডে অনুলিপি করুন',
        copied: 'অনুলিপি সম্পন্ন!',

        share_table_dialog: {
            title: 'টেবিল ভাগ করুন',
            description: 'এই টেবিলটি ভাগ করতে নীচের লিঙ্কটি অনুলিপি করুন।',
            close: 'বন্ধ',
        },

        side_panel: {
            view_all_options: 'সমস্ত বিকল্প দেখুন...',
            tables_section: {
                tables: 'টেবিল',
                add_table: 'টেবিল যোগ করুন',
                add_view: 'ভিউ যোগ করুন',
                filter: 'ফিল্টার',
                collapse: 'সব ভাঁজ করুন',
                clear: 'ফিল্টার সাফ করুন',
                no_results:
                    'আপনার ফিল্টারটির সাথে মিলে যাওয়ার কোনও টেবিল পাওয়া যায় নি।',
                show_list: 'টেবিল তালিকা দেখান',
                show_dbml: 'ডিবিএমএল সম্পাদক দেখান',

                table: {
                    fields: 'ফিল্ড',
                    nullable: 'নালযোগ্য?',
                    primary_key: 'প্রাথমিক কী',
                    indexes: 'ইনডেক্স',
                    comments: 'মন্তব্য',
                    no_comments: 'কোনো মন্তব্য নেই',
                    add_field: 'ফিল্ড যোগ করুন',
                    add_index: 'ইনডেক্স যোগ করুন',
                    index_select_fields: 'ফিল্ড নির্বাচন করুন',
                    no_types_found: 'কোনো ধরন পাওয়া যায়নি',
                    field_name: 'নাম',
                    field_type: 'ধরন',
                    field_actions: {
                        title: 'ফিল্ড কর্ম',
                        unique: 'অদ্বিতীয়',
                        auto_increment: 'স্বয়ংক্রিয় বৃদ্ধি',
                        comments: 'মন্তব্য',
                        no_comments: 'কোনো মন্তব্য নেই',
                        delete_field: 'ফিল্ড মুছুন',
                        default_value: 'Default Value',
                        no_default: 'No default',
                        character_length: 'Max Length',
                        precision: 'নির্ভুলতা',
                        scale: 'স্কেল',
                    },
                    index_actions: {
                        title: 'ইনডেক্স কর্ম',
                        name: 'নাম',
                        unique: 'অদ্বিতীয়',
                        index_type: 'ইনডেক্স ধরন',
                        delete_index: 'ইনডেক্স মুছুন',
                    },
                    table_actions: {
                        title: 'টেবিল কর্ম',
                        change_schema: 'স্কিমা পরিবর্তন করুন',
                        add_field: 'ফিল্ড যোগ করুন',
                        add_index: 'ইনডেক্স যোগ করুন',
                        duplicate_table: 'টেবিল নকল করুন',
                        delete_table: 'টেবিল মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোনো টেবিল নেই',
                    description: 'শুরু করতে একটি টেবিল তৈরি করুন',
                },
            },
            refs_section: {
                refs: 'রেফস',
                filter: 'ফিল্টার',
                collapse: 'সব ভাঁজ করুন',
                add_relationship: 'সম্পর্ক যোগ করুন',
                relationships: 'সম্পর্ক',
                dependencies: 'নির্ভরতাগুলি',
                relationship: {
                    relationship: 'সম্পর্ক',
                    primary: 'প্রাথমিক টেবিল',
                    foreign: 'রেফারেন্স করা টেবিল',
                    cardinality: 'কার্ডিনালিটি',
                    delete_relationship: 'মুছুন',
                    relationship_actions: {
                        title: 'কর্ম',
                        delete_relationship: 'মুছুন',
                    },
                },
                dependency: {
                    dependency: 'নির্ভরতা',
                    table: 'টেবিল',
                    dependent_table: 'নির্ভরশীল ভিউ',
                    delete_dependency: 'মুছুন',
                    dependency_actions: {
                        title: 'কর্ম',
                        delete_dependency: 'মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোনো সম্পর্ক নেই',
                    description: 'শুরু করতে একটি সম্পর্ক তৈরি করুন',
                },
            },
            areas_section: {
                areas: 'অঞ্চল',
                add_area: 'অঞ্চল যুক্ত করুন',
                filter: 'ফিল্টার',
                clear: 'ফিল্টার সাফ করুন',
                no_results:
                    'আপনার ফিল্টারটির সাথে মিলে যাওয়া কোনও অঞ্চলই পাওয়া যায় নি।',

                area: {
                    area_actions: {
                        title: 'অঞ্চল ক্রিয়া',
                        edit_name: 'নাম সম্পাদনা করুন',
                        delete_area: 'অঞ্চল মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোন অঞ্চল নেই',
                    description: 'শুরু করার জন্য একটি অঞ্চল তৈরি করুন',
                },
            },
            custom_types_section: {
                custom_types: 'কাস্টম প্রকার',
                filter: 'ফিল্টার',
                clear: 'ফিল্টার সাফ করুন',
                no_results:
                    'কোনও কাস্টম প্রকার আপনার ফিল্টারটির সাথে মিলে যায় না।',
                empty_state: {
                    title: 'কোন কাস্টম প্রকার নেই',
                    description:
                        'কাস্টম প্রকারগুলি এখানে আপনার ডাটাবেসে উপলব্ধ থাকলে এখানে উপস্থিত হবে',
                },
                custom_type: {
                    kind: 'দয়ালু',
                    enum_values: 'এনাম মান',
                    composite_fields: 'ক্ষেত্র',
                    no_fields: 'কোনও ক্ষেত্র সংজ্ঞায়িত করা হয়নি',
                    no_values: 'কোন enum মান সংজ্ঞায়িত নেই',
                    field_name_placeholder: 'মাঠের নাম',
                    field_type_placeholder: 'প্রকার নির্বাচন করুন',
                    add_field: 'ক্ষেত্র যুক্ত করুন',
                    no_fields_tooltip:
                        'এই কাস্টম প্রকারের জন্য কোনও ক্ষেত্র সংজ্ঞায়িত করা হয়নি',
                    custom_type_actions: {
                        title: 'ক্রিয়া',
                        highlight_fields: 'ক্ষেত্রগুলি হাইলাইট করুন',
                        delete_custom_type: 'মুছুন',
                        clear_field_highlight: 'পরিষ্কার হাইলাইট',
                    },
                    delete_custom_type: 'টাইপ মুছুন',
                },
            },
        },

        toolbar: {
            zoom_in: 'জুম ইন',
            zoom_out: 'জুম আউট',
            save: 'সংরক্ষণ করুন',
            show_all: 'সব দেখান',
            undo: 'পূর্বাবস্থায় ফিরুন',
            redo: 'পুনরায় করুন',
            reorder_diagram: 'স্বয়ংক্রিয় ডায়াগ্রাম সাজান',
            highlight_overlapping_tables: 'ওভারল্যাপিং টেবিল হাইলাইট করুন',
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            filter: 'Filter Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'আপনার ডাটাবেস কী?',
                description:
                    'প্রত্যেক ডাটাবেসের নিজস্ব বৈশিষ্ট্য এবং ক্ষমতা রয়েছে।',
                check_examples_long: 'উদাহরণ দেখুন',
                check_examples_short: 'উদাহরণ',
            },

            import_database: {
                title: 'আপনার ডাটাবেস আমদানি করুন',
                database_edition: 'ডাটাবেস সংস্করণ:',
                step_1: 'আপনার ডাটাবেসে এই স্ক্রিপ্ট চালান:',
                step_2: 'স্ক্রিপ্টের ফলাফল এখানে পেস্ট করুন →',
                script_results_placeholder: 'স্ক্রিপ্টের ফলাফল এখানে...',
                ssms_instructions: {
                    button_text: 'SSMS নির্দেশনা',
                    title: 'নির্দেশনা',
                    step_1: 'টুলস > অপশন > কোয়েরি ফলাফল > SQL সার্ভারে যান।',
                    step_2: 'যদি আপনি "গ্রিডে ফলাফল" ব্যবহার করেন, তাহলে নন-XML ডেটার জন্য সর্বাধিক চরিত্রগুলি 9999999-এ সেট করুন।',
                },
                instructions_link: 'সাহায্যের প্রয়োজন? এখানে দেখুন',
                check_script_result: 'স্ক্রিপ্ট ফলাফল যাচাই করুন',
            },

            cancel: 'বাতিল করুন',
            back: 'ফিরে যান',
            import_from_file: 'ফাইল থেকে আমদানি করুন',
            empty_diagram: 'ফাঁকা চিত্র',
            continue: 'চালিয়ে যান',
            import: 'আমদানি করুন',
        },

        open_diagram_dialog: {
            title: 'ডেটাবেস খুলুন',
            description: 'নিচের তালিকা থেকে একটি চিত্র নির্বাচন করুন।',
            table_columns: {
                name: 'নাম',
                created_at: 'তৈরির তারিখ',
                last_modified: 'সর্বশেষ পরিবর্তিত',
                tables_count: 'টেবিল',
            },
            cancel: 'বাতিল করুন',
            start_new: 'নতুন ডায়াগ্রাম দিয়ে শুরু করুন',
            open: 'খুলুন',

            diagram_actions: {
                open: 'খুলুন',
                duplicate: 'ডুপ্লিকেট',
                delete: 'মুছুন',
            },
        },

        export_sql_dialog: {
            title: 'SQL রপ্তানি করুন',
            description:
                '{{databaseType}} স্ক্রিপ্টের জন্য আপনার ডায়াগ্রাম স্কিমা রপ্তানি করুন',
            close: 'বন্ধ করুন',
            loading: {
                text: '{{databaseType}} এর জন্য AI SQL তৈরি হচ্ছে...',
                description: 'এতে ৩০ সেকেন্ড পর্যন্ত সময় লাগতে পারে।',
            },
            error: {
                message:
                    'SQL স্ক্রিপ্ট তৈরি করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন বা <0>আমাদের সাথে যোগাযোগ করুন</0>।',
                description:
                    'আপনার OPENAI_TOKEN ব্যবহার করার জন্য বিনামূল্যে অভিজ্ঞতা নিন, ম্যানুয়াল <0>এখানে দেখুন</0>।',
            },
        },

        create_relationship_dialog: {
            title: 'সম্পর্ক তৈরি করুন',
            primary_table: 'প্রাথমিক টেবিল',
            primary_field: 'প্রাথমিক ক্ষেত্র',
            referenced_table: 'রেফারেন্স করা টেবিল',
            referenced_field: 'রেফারেন্স করা ক্ষেত্র',
            primary_table_placeholder: 'টেবিল নির্বাচন করুন',
            primary_field_placeholder: 'ক্ষেত্র নির্বাচন করুন',
            referenced_table_placeholder: 'টেবিল নির্বাচন করুন',
            referenced_field_placeholder: 'ক্ষেত্র নির্বাচন করুন',
            no_tables_found: 'কোন টেবিল পাওয়া যায়নি',
            no_fields_found: 'কোন ক্ষেত্র পাওয়া যায়নি',
            create: 'তৈরি করুন',
            cancel: 'বাতিল করুন',
        },

        import_database_dialog: {
            title: 'বর্তমান চিত্রে আমদানি করুন',
            override_alert: {
                title: 'ডাটাবেস আমদানি করুন',
                content: {
                    alert: 'এই চিত্র আমদানির ফলে বিদ্যমান টেবিল ও সম্পর্ক প্রভাবিত হবে।',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> নতুন টেবিল যোগ করা হবে।',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> নতুন সম্পর্ক তৈরি করা হবে।',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> টেবিল ওভাররাইট করা হবে।',
                    proceed: 'আপনি কি এগিয়ে যেতে চান?',
                },
                import: 'আমদানি করুন',
                cancel: 'বাতিল করুন',
            },
        },

        export_image_dialog: {
            title: 'চিত্র রপ্তানি করুন',
            description: 'রপ্তানির জন্য স্কেল ফ্যাক্টর নির্বাচন করুন:',
            scale_1x: '1x স্বাভাবিক',
            scale_2x: '2x (প্রস্তাবিত)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'বাতিল করুন',
            export: 'রপ্তানি করুন',
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'স্কিমা নির্বাচন করুন',
            description:
                'বর্তমানে অনেক স্কিমা প্রদর্শিত হচ্ছে। নতুন টেবিলের জন্য একটি নির্বাচন করুন।',
            cancel: 'বাতিল করুন',
            confirm: 'নিশ্চিত করুন',
        },

        update_table_schema_dialog: {
            title: 'স্কিমা পরিবর্তন করুন',
            description: 'টেবিল "{{tableName}}" এর জন্য স্কিমা আপডেট করুন',
            cancel: 'বাতিল করুন',
            confirm: 'পরিবর্তন করুন',
        },
        create_table_schema_dialog: {
            title: 'নতুন স্কিমা তৈরি করুন',
            description:
                'এখনও কোনো স্কিমা নেই। আপনার টেবিলগুলি সংগঠিত করতে আপনার প্রথম স্কিমা তৈরি করুন।',
            create: 'তৈরি করুন',
            cancel: 'বাতিল করুন',
        },

        star_us_dialog: {
            title: 'আমাদের উন্নত করতে সাহায্য করুন!',
            description:
                'আপনি কি GitHub-এ আমাদের একটি স্টার দিতে পারবেন? এটি মাত্র এক ক্লিক দূরে!',
            close: 'এখন নয়',
            confirm: 'অবশ্যই!',
        },

        export_diagram_dialog: {
            title: 'চিত্র রপ্তানি করুন',
            description: 'রপ্তানির জন্য ফরম্যাট নির্বাচন করুন:',
            format_json: 'JSON',
            cancel: 'বাতিল করুন',
            export: 'রপ্তানি করুন',
            error: {
                title: 'চিত্র রপ্তানিতে ত্রুটি',
                description:
                    'কিছু ভুল হয়েছে। সাহায্যের প্রয়োজন? support@chartdb.io-এ যোগাযোগ করুন।',
            },
        },

        import_diagram_dialog: {
            title: 'চিত্র আমদানি করুন',
            description: 'নীচে ডায়াগ্রাম JSON পেস্ট করুন:',
            cancel: 'বাতিল করুন',
            import: 'আমদানি করুন',
            error: {
                title: 'চিত্র আমদানিতে ত্রুটি',
                description:
                    'ডায়াগ্রাম JSON অবৈধ। অনুগ্রহ করে JSON পরীক্ষা করুন এবং আবার চেষ্টা করুন। সাহায্যের প্রয়োজন? support@chartdb.io-এ যোগাযোগ করুন।',
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
            one_to_one: 'এক থেকে এক',
            one_to_many: 'এক থেকে অনেক',
            many_to_one: 'অনেক থেকে এক',
            many_to_many: 'অনেক থেকে অনেক',
        },

        canvas_context_menu: {
            new_table: 'নতুন টেবিল',
            new_view: 'নতুন ভিউ',
            new_relationship: 'নতুন সম্পর্ক',
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'টেবিল সম্পাদনা করুন',
            duplicate_table: 'টেবিল নকল করুন',
            delete_table: 'টেবিল মুছে ফেলুন',
            add_relationship: 'সম্পর্ক যুক্ত করুন',
        },

        snap_to_grid_tooltip: 'গ্রিডে স্ন্যাপ করুন (অবস্থান {{key}})',

        tool_tips: {
            double_click_to_edit: 'সম্পাদনা করতে ডাবল-ক্লিক করুন',
        },

        language_select: {
            change_language: 'ভাষা পরিবর্তন করুন',
        },

        on: 'চালু',
        off: 'বন্ধ',
    },
};

export const bnMetadata: LanguageMetadata = {
    name: 'Bengali',
    nativeName: 'বাংলা',
    code: 'bn',
};
