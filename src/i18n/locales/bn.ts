import type { LanguageMetadata, LanguageTranslation } from '../types';

export const bn: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'ফাইল',
                new: 'নতুন',
                open: 'খুলুন',
                save: 'সংরক্ষণ করুন',
                import_database: 'ডাটাবেস আমদানি',
                export_sql: 'SQL রপ্তানি',
                export_as: 'হিসাবে রপ্তানি',
                delete_diagram: 'ডায়াগ্রাম মুছুন',
                exit: 'প্রস্থান',
            },
            edit: {
                edit: 'সম্পাদনা',
                undo: 'পূর্বাবস্থায় ফেরত',
                redo: 'পুনরায় করুন',
                clear: 'পরিষ্কার',
            },
            view: {
                view: 'দৃশ্য',
                show_sidebar: 'সাইডবার দেখান',
                hide_sidebar: 'সাইডবার লুকান',
                hide_cardinality: 'কার্ডিনালিটি লুকান',
                show_cardinality: 'কার্ডিনালিটি দেখান',
                zoom_on_scroll: 'স্ক্রল করার সময় জুম',
                theme: 'থিম',
                show_dependencies: 'নির্ভরতাগুলি দেখান',
                hide_dependencies: 'নির্ভরতাগুলি লুকান',
            },
            share: {
                share: 'শেয়ার',
                export_diagram: 'ডায়াগ্রাম রপ্তানি',
                import_diagram: 'ডায়াগ্রাম আমদানি',
            },
            help: {
                help: 'সাহায্য',
                visit_website: 'ChartDB ভিজিট করুন',
                join_discord: 'আমাদের Discord-এ যোগ দিন',
                schedule_a_call: 'আমাদের সাথে কথা বলুন!',
            },
        },

        delete_diagram_alert: {
            title: 'ডায়াগ্রাম মুছুন',
            description:
                'এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না। এটি স্থায়ীভাবে ডায়াগ্রাম মুছে দেবে।',
            cancel: 'বাতিল',
            delete: 'মুছুন',
        },

        clear_diagram_alert: {
            title: 'ডায়াগ্রাম পরিষ্কার করুন',
            description:
                'এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না। এটি ডায়াগ্রামের সমস্ত ডেটা স্থায়ীভাবে মুছে দেবে।',
            cancel: 'বাতিল',
            clear: 'পরিষ্কার',
        },

        reorder_diagram_alert: {
            title: 'ডায়াগ্রাম পুনরায় সাজান',
            description:
                'এই ক্রিয়াটি ডায়াগ্রামের সমস্ত টেবিল পুনরায় সাজাবে। আপনি কি চালিয়ে যেতে চান?',
            reorder: 'পুনরায় সাজান',
            cancel: 'বাতিল',
        },

        multiple_schemas_alert: {
            title: 'একাধিক স্কিমা',
            description:
                '{{schemasCount}} স্কিমা এই ডায়াগ্রামে রয়েছে। বর্তমানে প্রদর্শিত: {{formattedSchemas}}।',
            dont_show_again: 'আবার দেখাবেন না',
            change_schema: 'পরিবর্তন করুন',
            none: 'কিছুই না',
        },

        theme: {
            system: 'সিস্টেম',
            light: 'আলো',
            dark: 'অন্ধকার',
        },

        zoom: {
            on: 'চালু',
            off: 'বন্ধ',
        },

        last_saved: 'সর্বশেষ সংরক্ষণ',
        saved: 'সংরক্ষিত',
        diagrams: 'ডায়াগ্রামগুলি',
        loading_diagram: 'ডায়াগ্রাম লোড হচ্ছে...',
        deselect_all: 'সব নির্বাচন বাতিল',
        select_all: 'সব নির্বাচন করুন',
        clear: 'পরিষ্কার',
        show_more: 'আরও দেখান',
        show_less: 'কম দেখান',
        copy_to_clipboard: 'ক্লিপবোর্ডে কপি করুন',
        copied: 'কপি করা হয়েছে!',

        side_panel: {
            schema: 'স্কিমা:',
            filter_by_schema: 'স্কিমা দ্বারা ফিল্টার করুন',
            search_schema: 'স্কিমা অনুসন্ধান করুন...',
            no_schemas_found: 'কোন স্কিমা পাওয়া যায়নি।',
            view_all_options: 'সমস্ত বিকল্প দেখুন...',
            tables_section: {
                tables: 'টেবিল',
                add_table: 'টেবিল যোগ করুন',
                filter: 'ফিল্টার',
                collapse: 'সব কিছু ভাঁজ করুন',

                table: {
                    fields: 'ক্ষেত্র',
                    nullable: 'শূন্যযোগ্য?',
                    primary_key: 'প্রাথমিক কী',
                    indexes: 'সূচি',
                    comments: 'মন্তব্য',
                    no_comments: 'কোন মন্তব্য নেই',
                    add_field: 'ক্ষেত্র যোগ করুন',
                    add_index: 'সূচি যোগ করুন',
                    index_select_fields: 'ক্ষেত্র নির্বাচন করুন',
                    no_types_found: 'কোন প্রকার পাওয়া যায়নি',
                    field_name: 'নাম',
                    field_type: 'প্রকার',
                    field_actions: {
                        title: 'ক্ষেত্র বৈশিষ্ট্য',
                        unique: 'অদ্বিতীয়',
                        comments: 'মন্তব্য',
                        no_comments: 'কোন মন্তব্য নেই',
                        delete_field: 'ক্ষেত্র মুছুন',
                    },
                    index_actions: {
                        title: 'সূচি বৈশিষ্ট্য',
                        name: 'নাম',
                        unique: 'অদ্বিতীয়',
                        delete_index: 'সূচি মুছুন',
                    },
                    table_actions: {
                        title: 'টেবিল ক্রিয়া',
                        change_schema: 'স্কিমা পরিবর্তন করুন',
                        add_field: 'ক্ষেত্র যোগ করুন',
                        add_index: 'সূচি যোগ করুন',
                        duplicate_table: 'টেবিল নকল করুন',
                        delete_table: 'টেবিল মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোন টেবিল নেই',
                    description: 'শুরু করতে একটি টেবিল তৈরি করুন',
                },
            },
            relationships_section: {
                relationships: 'সম্পর্কসমূহ',
                filter: 'ফিল্টার',
                add_relationship: 'সম্পর্ক যোগ করুন',
                collapse: 'সব কিছু ভাঁজ করুন',
                relationship: {
                    primary: 'প্রাথমিক টেবিল',
                    foreign: 'রেফারেন্সড টেবিল',
                    cardinality: 'কার্ডিনালিটি',
                    delete_relationship: 'মুছুন',
                    relationship_actions: {
                        title: 'ক্রিয়া',
                        delete_relationship: 'মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোন সম্পর্ক নেই',
                    description: 'টেবিল সংযোগ করতে একটি সম্পর্ক তৈরি করুন',
                },
            },
            dependencies_section: {
                dependencies: 'নির্ভরতাগুলি',
                filter: 'ফিল্টার',
                collapse: 'সব কিছু ভাঁজ করুন',
                dependency: {
                    table: 'টেবিল',
                    dependent_table: 'নির্ভরশীল ভিউ',
                    delete_dependency: 'মুছুন',
                    dependency_actions: {
                        title: 'ক্রিয়া',
                        delete_dependency: 'মুছুন',
                    },
                },
                empty_state: {
                    title: 'কোন নির্ভরতা নেই',
                    description: 'শুরু করতে একটি ভিউ তৈরি করুন',
                },
            },
        },

        toolbar: {
            zoom_in: 'জুম ইন',
            zoom_out: 'জুম আউট',
            save: 'সংরক্ষণ করুন',
            show_all: 'সব দেখান',
            undo: 'পূর্বাবস্থায় ফেরত',
            redo: 'পুনরায় করুন',
            reorder_diagram: 'ডায়াগ্রাম পুনরায় সাজান',
            highlight_overlapping_tables: 'ওভারল্যাপিং টেবিল হাইলাইট করুন',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'আপনার ডাটাবেস কী?',
                description:
                    'প্রতিটি ডাটাবেসের নিজস্ব বৈশিষ্ট্য এবং ক্ষমতা রয়েছে।',
                check_examples_long: 'উদাহরণ দেখুন',
                check_examples_short: 'উদাহরণ',
            },
        },
    },
};

export const bnMetadata: LanguageMetadata = {
    name: 'বাংলা',
    nativeName: 'বাংলা',
    code: 'bn',
};
