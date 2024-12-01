import type { LanguageMetadata, LanguageTranslation } from '../types';

export const bn: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'ফাইল',
                new: 'নতুন',
                open: 'খুলুন',
                save: 'সংরক্ষণ করুন',
                import_database: 'ডাটাবেস আমদানি করুন',
                export_sql: 'SQL রপ্তানি করুন',
                export_as: 'রূপে রপ্তানি করুন',
                delete_diagram: 'ডায়াগ্রাম মুছুন',
                exit: 'প্রস্থান করুন',
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
                zoom_on_scroll: 'স্ক্রলে জুম করুন',
                theme: 'থিম',
                show_dependencies: 'নির্ভরতাগুলি দেখান',
                hide_dependencies: 'নির্ভরতাগুলি লুকান',
            },

            share: {
                share: 'শেয়ার করুন',
                export_diagram: 'ডায়াগ্রাম রপ্তানি করুন',
                import_diagram: 'ডায়াগ্রাম আমদানি করুন',
            },
            help: {
                help: 'সাহায্য',
                visit_website: 'ChartDB ওয়েবসাইটে যান',
                join_discord: 'আমাদের Discord-এ যোগ দিন',
                schedule_a_call: 'আমাদের সাথে কথা বলুন!',
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
            title: 'ডায়াগ্রাম পুনর্বিন্যাস করুন',
            description:
                'এই কাজটি ডায়াগ্রামের সমস্ত টেবিল পুনর্বিন্যাস করবে। আপনি কি চালিয়ে যেতে চান?',
            reorder: 'পুনর্বিন্যাস করুন',
            cancel: 'বাতিল করুন',
        },

        multiple_schemas_alert: {
            title: 'বহু স্কিমা',
            description:
                '{{schemasCount}} স্কিমা এই ডায়াগ্রামে রয়েছে। বর্তমানে প্রদর্শিত: {{formattedSchemas}}।',
            dont_show_again: 'পুনরায় দেখাবেন না',
            change_schema: 'পরিবর্তন করুন',
            none: 'কিছুই না',
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
        diagrams: 'ডায়াগ্রাম',
        loading_diagram: 'ডায়াগ্রাম লোড হচ্ছে...',
        deselect_all: 'সব নির্বাচন সরান',
        select_all: 'সব নির্বাচন করুন',
        clear: 'পরিষ্কার করুন',
        show_more: 'আরও দেখুন',
        show_less: 'কম দেখুন',
        copy_to_clipboard: 'ক্লিপবোর্ডে অনুলিপি করুন',
        copied: 'অনুলিপি সম্পন্ন!',

        side_panel: {
            schema: 'স্কিমা:',
            filter_by_schema: 'স্কিমা দ্বারা ফিল্টার করুন',
            search_schema: 'স্কিমা খুঁজুন...',
            no_schemas_found: 'কোনো স্কিমা পাওয়া যায়নি।',
            view_all_options: 'সমস্ত বিকল্প দেখুন...',
            tables_section: {
                tables: 'টেবিল',
                add_table: 'টেবিল যোগ করুন',
                filter: 'ফিল্টার',
                collapse: 'সব ভাঁজ করুন',

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
                        comments: 'মন্তব্য',
                        no_comments: 'কোনো মন্তব্য নেই',
                        delete_field: 'ফিল্ড মুছুন',
                    },
                    index_actions: {
                        title: 'ইনডেক্স কর্ম',
                        name: 'নাম',
                        unique: 'অদ্বিতীয়',
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
            relationships_section: {
                relationships: 'সম্পর্ক',
                filter: 'ফিল্টার',
                add_relationship: 'সম্পর্ক যোগ করুন',
                collapse: 'সব ভাঁজ করুন',
                relationship: {
                    primary: 'প্রাথমিক টেবিল',
                    foreign: 'বিদেশি টেবিল',
                    cardinality: 'কার্ডিনালিটি',
                    delete_relationship: 'মুছুন',
                    relationship_actions: {
                        title: 'কর্ম',
                        delete_relationship: 'মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোনো সম্পর্ক নেই',
                    description: 'টেবিল সংযোগ করতে একটি সম্পর্ক তৈরি করুন',
                },
            },
            dependencies_section: {
                dependencies: 'নির্ভরতাগুলি',
                filter: 'ফিল্টার',
                collapse: 'ভাঁজ করুন',
                dependency: {
                    table: 'টেবিল',
                    dependent_table: 'নির্ভরশীল টেবিল',
                    delete_dependency: 'নির্ভরতা মুছুন',
                    dependency_actions: {
                        title: 'কর্ম',
                        delete_dependency: 'নির্ভরতা মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোনো নির্ভরতাগুলি নেই',
                    description: 'এই অংশে কোনো নির্ভরতা উপলব্ধ নেই।',
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
            reorder_diagram: 'ডায়াগ্রাম পুনর্বিন্যাস করুন',
            highlight_overlapping_tables: 'ওভারল্যাপিং টেবিল হাইলাইট করুন',
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
                step_2: 'স্ক্রিপ্টের ফলাফল এখানে পেস্ট করুন:',
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
            title: 'চিত্র খুলুন',
            description: 'নিচের তালিকা থেকে একটি চিত্র নির্বাচন করুন।',
            table_columns: {
                name: 'নাম',
                created_at: 'তৈরির তারিখ',
                last_modified: 'সর্বশেষ পরিবর্তিত',
                tables_count: 'টেবিল',
            },
            cancel: 'বাতিল করুন',
            open: 'খুলুন',
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
                    'কিছু ভুল হয়েছে। সাহায্যের প্রয়োজন? chartdb.io@gmail.com-এ যোগাযোগ করুন।',
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
                    'ডায়াগ্রাম JSON অবৈধ। অনুগ্রহ করে JSON পরীক্ষা করুন এবং আবার চেষ্টা করুন। সাহায্যের প্রয়োজন? chartdb.io@gmail.com-এ যোগাযোগ করুন।',
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
            new_relationship: 'নতুন সম্পর্ক',
        },

        table_node_context_menu: {
            edit_table: 'টেবিল সম্পাদনা করুন',
            duplicate_table: 'টেবিল নকল করুন',
            delete_table: 'টেবিল মুছে ফেলুন',
        },

        snap_to_grid_tooltip: 'গ্রিডে স্ন্যাপ করুন (অবস্থান {{key}})',

        tool_tips: {
            double_click_to_edit: 'সম্পাদনা করতে ডাবল-ক্লিক করুন',
        },

        language_select: {
            change_language: 'ভাষা পরিবর্তন করুন',
        },
    },
};

export const bnMetadata: LanguageMetadata = {
    name: 'Bengali',
    nativeName: 'বাংলা',
    code: 'bn',
};
