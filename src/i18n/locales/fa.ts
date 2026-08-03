import type { LanguageMetadata, LanguageTranslation } from '../types';

export const fa: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'جدید',
            browse: 'باز کردن',
            tables: 'جدول‌ها',
            refs: 'ارجاع‌ها',
            dependencies: 'وابستگی‌ها',
            custom_types: 'نوع‌های سفارشی',
            visuals: 'عناصر بصری',
        },
        menu: {
            actions: {
                actions: 'عملیات',
                new: 'جدید...',
                browse: 'همه پایگاه‌های داده...',
                save: 'ذخیره',
                import: 'وارد کردن',
                export_sql: 'خروجی SQL',
                export_as: 'خروجی به‌صورت',
                delete_diagram: 'حذف',
            },
            edit: {
                edit: 'ویرایش',
                undo: 'واگرد',
                redo: 'انجام مجدد',
                clear: 'پاک کردن',
            },
            view: {
                view: 'نمایش',
                show_sidebar: 'نمایش نوار کناری',
                hide_sidebar: 'پنهان کردن نوار کناری',
                hide_cardinality: 'پنهان کردن کاردینالیتی',
                show_cardinality: 'نمایش کاردینالیتی',
                hide_field_attributes: 'پنهان کردن ویژگی‌های فیلد',
                show_field_attributes: 'نمایش ویژگی‌های فیلد',
                zoom_on_scroll: 'بزرگ‌نمایی هنگام پیمایش',
                show_views: 'نماهای پایگاه داده',
                theme: 'پوسته',
                show_dependencies: 'نمایش وابستگی‌ها',
                hide_dependencies: 'پنهان کردن وابستگی‌ها',
                show_minimap: 'نمایش نقشه کوچک',
                hide_minimap: 'پنهان کردن نقشه کوچک',
            },
            backup: {
                backup: 'پشتیبان‌گیری',
                export_diagram: 'خروجی گرفتن از نمودار',
                restore_diagram: 'بازیابی نمودار',
            },
            help: {
                help: 'راهنما',
                docs_website: 'مستندات',
                join_discord: 'به دیسکورد ما بپیوندید',
            },
        },

        delete_diagram_alert: {
            title: 'حذف نمودار',
            description:
                'این عملیات قابل بازگشت نیست و نمودار را برای همیشه حذف می‌کند.',
            cancel: 'انصراف',
            delete: 'حذف',
        },

        clear_diagram_alert: {
            title: 'پاک کردن نمودار',
            description:
                'این عملیات قابل بازگشت نیست و همه داده‌های نمودار را برای همیشه حذف می‌کند.',
            cancel: 'انصراف',
            clear: 'پاک کردن',
        },

        reorder_diagram_alert: {
            title: 'چیدمان خودکار نمودار',
            description:
                'این عملیات همه جدول‌های نمودار را دوباره مرتب می‌کند. آیا می‌خواهید ادامه دهید؟',
            reorder: 'چیدمان خودکار',
            cancel: 'انصراف',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'کپی ناموفق بود',
                description: 'کلیپ‌بورد پشتیبانی نمی‌شود.',
            },
            failed: {
                title: 'کپی ناموفق بود',
                description: 'مشکلی پیش آمد. دوباره تلاش کنید.',
            },
        },

        theme: {
            system: 'سیستم',
            light: 'روشن',
            dark: 'تیره',
        },

        zoom: {
            on: 'روشن',
            off: 'خاموش',
        },

        last_saved: 'آخرین ذخیره',
        saved: 'ذخیره شد',
        loading_diagram: 'در حال بارگذاری نمودار...',
        deselect_all: 'لغو انتخاب همه',
        select_all: 'انتخاب همه',
        clear: 'پاک کردن',
        show_more: 'نمایش بیشتر',
        show_less: 'نمایش کمتر',
        copy_to_clipboard: 'کپی در کلیپ‌بورد',
        copied: 'کپی شد!',

        side_panel: {
            view_all_options: 'نمایش همه گزینه‌ها...',
            tables_section: {
                tables: 'جدول‌ها',
                add_table: 'افزودن جدول',
                add_view: 'افزودن نما',
                filter: 'فیلتر',
                collapse: 'جمع کردن همه',
                clear: 'پاک کردن فیلتر',
                no_results: 'هیچ جدولی مطابق فیلتر شما پیدا نشد.',
                show_list: 'نمایش فهرست جدول‌ها',
                show_dbml: 'نمایش ویرایشگر DBML',
                all_hidden: 'همه جدول‌ها پنهان هستند',
                show_all: 'نمایش همه',

                table: {
                    fields: 'فیلدها',
                    nullable: 'قابل تهی؟',
                    primary_key: 'کلید اصلی',
                    indexes: 'ایندکس‌ها',
                    check_constraints: 'محدودیت‌های بررسی',
                    comments: 'توضیحات',
                    no_comments: 'بدون توضیحات',
                    add_field: 'افزودن فیلد',
                    add_index: 'افزودن ایندکس',
                    add_check: 'افزودن بررسی',
                    index_select_fields: 'انتخاب فیلدها',
                    no_types_found: 'هیچ نوعی پیدا نشد',
                    field_name: 'نام',
                    field_type: 'نوع',
                    field_actions: {
                        title: 'ویژگی‌های فیلد',
                        unique: 'یکتا',
                        auto_increment: 'افزایش خودکار',
                        character_length: 'حداکثر طول',
                        precision: 'دقت',
                        scale: 'مقیاس',
                        comments: 'توضیحات',
                        no_comments: 'بدون توضیحات',
                        default_value: 'مقدار پیش‌فرض',
                        no_default: 'بدون مقدار پیش‌فرض',
                        delete_field: 'حذف فیلد',
                    },
                    index_actions: {
                        title: 'ویژگی‌های ایندکس',
                        name: 'نام',
                        unique: 'یکتا',
                        index_type: 'نوع ایندکس',
                        delete_index: 'حذف ایندکس',
                    },
                    check_constraint_actions: {
                        title: 'محدودیت بررسی',
                        expression: 'عبارت',
                        delete: 'حذف محدودیت بررسی',
                    },
                    table_actions: {
                        title: 'عملیات جدول',
                        change_schema: 'تغییر شِما',
                        add_field: 'افزودن فیلد',
                        add_index: 'افزودن ایندکس',
                        duplicate_table: 'تکثیر جدول',
                        delete_table: 'حذف جدول',
                    },
                },
                empty_state: {
                    title: 'جدولی وجود ندارد',
                    description: 'برای شروع یک جدول بسازید',
                },
            },
            refs_section: {
                refs: 'ارجاع‌ها',
                filter: 'فیلتر',
                collapse: 'جمع کردن همه',
                add_relationship: 'افزودن رابطه',
                relationships: 'روابط',
                dependencies: 'وابستگی‌ها',
                relationship: {
                    relationship: 'رابطه',
                    primary: 'جدول اصلی',
                    foreign: 'جدول مرتبط',
                    cardinality: 'کاردینالیتی',
                    delete_relationship: 'حذف',
                    switch_tables: 'جابه‌جایی جدول‌ها',
                    relationship_actions: {
                        title: 'عملیات',
                        delete_relationship: 'حذف',
                    },
                },
                dependency: {
                    dependency: 'وابستگی',
                    table: 'جدول',
                    dependent_table: 'نمای وابسته',
                    delete_dependency: 'حذف',
                    dependency_actions: {
                        title: 'عملیات',
                        delete_dependency: 'حذف',
                    },
                },
                empty_state: {
                    title: 'رابطه‌ای وجود ندارد',
                    description: 'برای شروع یک رابطه بسازید',
                },
            },

            areas_section: {
                areas: 'ناحیه‌ها',
                add_area: 'افزودن ناحیه',
                filter: 'فیلتر',
                clear: 'پاک کردن فیلتر',
                no_results: 'هیچ ناحیه‌ای مطابق فیلتر شما پیدا نشد.',

                area: {
                    area_actions: {
                        title: 'عملیات ناحیه',
                        edit_name: 'ویرایش نام',
                        delete_area: 'حذف ناحیه',
                    },
                },
                empty_state: {
                    title: 'ناحیه‌ای وجود ندارد',
                    description: 'برای شروع یک ناحیه بسازید',
                },
            },

            visuals_section: {
                visuals: 'عناصر بصری',
                tabs: {
                    areas: 'ناحیه‌ها',
                    notes: 'یادداشت‌ها',
                },
            },

            notes_section: {
                filter: 'فیلتر',
                add_note: 'افزودن یادداشت',
                no_results: 'یادداشتی پیدا نشد',
                clear: 'پاک کردن فیلتر',
                empty_state: {
                    title: 'یادداشتی وجود ندارد',
                    description:
                        'برای افزودن متن توضیحی روی بوم، یک یادداشت بسازید',
                },
                note: {
                    empty_note: 'یادداشت خالی',
                    note_actions: {
                        title: 'عملیات یادداشت',
                        edit_content: 'ویرایش محتوا',
                        delete_note: 'حذف یادداشت',
                    },
                },
            },

            custom_types_section: {
                custom_types: 'نوع‌های سفارشی',
                filter: 'فیلتر',
                clear: 'پاک کردن فیلتر',
                no_results: 'هیچ نوع سفارشی مطابق فیلتر شما پیدا نشد.',
                new_type: 'نوع جدید',
                empty_state: {
                    title: 'نوع سفارشی وجود ندارد',
                    description:
                        'نوع‌های سفارشی پس از در دسترس بودن در پایگاه داده، اینجا نمایش داده می‌شوند',
                },
                custom_type: {
                    kind: 'دسته',
                    enum_values: 'مقادیر شمارشی',
                    composite_fields: 'فیلدها',
                    no_fields: 'هیچ فیلدی تعریف نشده است',
                    no_values: 'هیچ مقداری تعریف نشده است',
                    field_name_placeholder: 'نام فیلد',
                    field_type_placeholder: 'انتخاب نوع',
                    add_field: 'افزودن فیلد',
                    no_fields_tooltip:
                        'هیچ فیلدی برای این نوع سفارشی تعریف نشده است',
                    custom_type_actions: {
                        title: 'عملیات',
                        highlight_fields: 'برجسته‌سازی فیلدها',
                        clear_field_highlight: 'پاک کردن برجسته‌سازی',
                        delete_custom_type: 'حذف',
                    },
                    delete_custom_type: 'حذف نوع',
                },
            },
        },

        toolbar: {
            zoom_in: 'بزرگ‌نمایی',
            zoom_out: 'کوچک‌نمایی',
            save: 'ذخیره',
            show_all: 'نمایش همه',
            undo: 'واگرد',
            redo: 'انجام مجدد',
            reorder_diagram: 'چیدمان خودکار نمودار',
            highlight_overlapping_tables: 'برجسته‌سازی جدول‌های هم‌پوشان',
            clear_custom_type_highlight: 'پاک کردن برجسته‌سازی «{{typeName}}»',
            custom_type_highlight_tooltip:
                '«{{typeName}}» برجسته شده است؛ برای پاک کردن کلیک کنید',
            filter: 'فیلتر جدول‌ها',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'پایگاه داده شما چیست؟',
                description:
                    'هر پایگاه داده ویژگی‌ها و قابلیت‌های منحصربه‌فرد خود را دارد.',
                check_examples_long: 'مشاهده نمونه‌ها',
                check_examples_short: 'نمونه‌ها',
            },

            import_database: {
                title: 'وارد کردن پایگاه داده',
                database_edition: 'نسخه پایگاه داده:',
                step_1: 'این اسکریپت را در پایگاه داده اجرا کنید:',
                step_2: 'نتیجه اسکریپت را در این پنجره جای‌گذاری کنید ←',
                script_results_placeholder:
                    'نتیجه اسکریپت را اینجا وارد کنید...',
                ssms_instructions: {
                    button_text: 'راهنمای SSMS',
                    title: 'دستورالعمل‌ها',
                    step_1: 'به Tools > Options > Query Results > SQL Server بروید.',
                    step_2: 'اگر از «Results to Grid» استفاده می‌کنید، مقدار Maximum Characters Retrieved را برای داده‌های Non-XML به 9999999 تغییر دهید.',
                },
                instructions_link: 'کمک می‌خواهید؟ روش کار را ببینید',
                check_script_result: 'بررسی نتیجه اسکریپت',
            },

            cancel: 'انصراف',
            import_from_file: 'وارد کردن از فایل',
            back: 'بازگشت',
            empty_diagram: 'پایگاه داده خالی',
            continue: 'ادامه',
            import: 'وارد کردن',
        },

        open_diagram_dialog: {
            title: 'باز کردن پایگاه داده',
            description: 'یک نمودار را از فهرست زیر برای باز کردن انتخاب کنید.',
            table_columns: {
                name: 'نام',
                created_at: 'زمان ایجاد',
                last_modified: 'آخرین تغییر',
                tables_count: 'جدول‌ها',
            },
            cancel: 'انصراف',
            open: 'باز کردن',
            new_database: 'پایگاه داده جدید',

            diagram_actions: {
                open: 'باز کردن',
                duplicate: 'تکثیر',
                delete: 'حذف',
            },
        },

        export_sql_dialog: {
            title: 'خروجی SQL',
            description:
                'از شِمای نمودار خود یک اسکریپت {{databaseType}} بسازید',
            close: 'بستن',
            loading: {
                text: 'هوش مصنوعی در حال تولید SQL برای {{databaseType}} است...',
                description: 'این فرایند ممکن است تا ۳۰ ثانیه طول بکشد.',
            },
            error: {
                message:
                    'تولید اسکریپت SQL ناموفق بود. بعداً دوباره تلاش کنید یا <0>با ما تماس بگیرید</0>.',
                description:
                    'می‌توانید از OPENAI_TOKEN خود استفاده کنید؛ راهنما را <0>اینجا</0> ببینید.',
            },
        },

        create_relationship_dialog: {
            title: 'ایجاد رابطه',
            primary_table: 'جدول اصلی',
            primary_field: 'فیلد اصلی',
            referenced_table: 'جدول مرجع',
            referenced_field: 'فیلد مرجع',
            primary_table_placeholder: 'انتخاب جدول',
            primary_field_placeholder: 'انتخاب فیلد',
            referenced_table_placeholder: 'انتخاب جدول',
            referenced_field_placeholder: 'انتخاب فیلد',
            no_tables_found: 'جدولی پیدا نشد',
            no_fields_found: 'فیلدی پیدا نشد',
            create: 'ایجاد',
            cancel: 'انصراف',
        },

        import_database_dialog: {
            title: 'وارد کردن به نمودار فعلی',
            override_alert: {
                title: 'وارد کردن پایگاه داده',
                content: {
                    alert: 'وارد کردن این نمودار بر جدول‌ها و روابط موجود اثر می‌گذارد.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> جدول جدید افزوده می‌شود.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> رابطه جدید ایجاد می‌شود.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> جدول بازنویسی می‌شود.',
                    proceed: 'آیا می‌خواهید ادامه دهید؟',
                },
                import: 'وارد کردن',
                cancel: 'انصراف',
            },
        },

        export_image_dialog: {
            title: 'خروجی تصویر',
            description: 'ضریب مقیاس خروجی را انتخاب کنید:',
            scale_1x: '۱x (کیفیت پایین)',
            scale_2x: '۲x (کیفیت معمولی)',
            scale_4x: '۴x (بهترین کیفیت)',
            cancel: 'انصراف',
            export: 'خروجی گرفتن',
            advanced_options: 'گزینه‌های پیشرفته',
            pattern: 'افزودن الگوی پس‌زمینه',
            pattern_description: 'افزودن الگوی شبکه‌ای ظریف به پس‌زمینه.',
            transparent: 'پس‌زمینه شفاف',
            transparent_description: 'حذف رنگ پس‌زمینه از تصویر.',
        },

        new_table_schema_dialog: {
            title: 'انتخاب شِما',
            description:
                'چند شِما در حال نمایش است. یکی را برای جدول جدید انتخاب کنید.',
            cancel: 'انصراف',
            confirm: 'تأیید',
        },

        update_table_schema_dialog: {
            title: 'تغییر شِما',
            description: 'شِمای جدول «{{tableName}}» را به‌روزرسانی کنید',
            cancel: 'انصراف',
            confirm: 'تغییر',
        },

        create_table_schema_dialog: {
            title: 'ایجاد شِمای جدید',
            description:
                'هنوز شِمایی وجود ندارد. برای سازمان‌دهی جدول‌ها نخستین شِما را بسازید.',
            create: 'ایجاد',
            cancel: 'انصراف',
        },

        star_us_dialog: {
            title: 'به بهتر شدن ما کمک کنید!',
            description:
                'مایلید در GitHub به ما ستاره بدهید؟ فقط یک کلیک فاصله دارید!',
            close: 'فعلاً نه',
            confirm: 'حتماً!',
        },
        export_diagram_dialog: {
            title: 'خروجی نمودار',
            description: 'قالب خروجی را انتخاب کنید:',
            format_json: 'JSON',
            cancel: 'انصراف',
            export: 'خروجی گرفتن',
            error: {
                title: 'خطا در خروجی گرفتن از نمودار',
                description: 'مشکلی پیش آمد. کمک می‌خواهید؟ support@chartdb.io',
            },
        },

        import_diagram_dialog: {
            title: 'وارد کردن نمودار',
            description: 'یک نمودار را از فایل JSON وارد کنید.',
            cancel: 'انصراف',
            import: 'وارد کردن',
            error: {
                title: 'خطا در وارد کردن نمودار',
                description:
                    'JSON نمودار معتبر نیست. آن را بررسی و دوباره تلاش کنید. کمک می‌خواهید؟ support@chartdb.io',
            },
        },

        import_dbml_dialog: {
            example_title: 'وارد کردن نمونه DBML',
            title: 'وارد کردن DBML',
            description: 'شِمای پایگاه داده را با قالب DBML وارد کنید.',
            import: 'وارد کردن',
            cancel: 'انصراف',
            skip_and_empty: 'رد کردن و ساخت نمودار خالی',
            show_example: 'نمایش نمونه',
            error: {
                title: 'خطا در وارد کردن DBML',
                description: 'تجزیه DBML ناموفق بود. نگارش آن را بررسی کنید.',
            },
        },
        relationship_type: {
            one_to_one: 'یک‌به‌یک',
            one_to_many: 'یک‌به‌چند',
            many_to_one: 'چندبه‌یک',
            many_to_many: 'چندبه‌چند',
        },

        canvas_context_menu: {
            new_table: 'جدول جدید',
            new_view: 'نمای جدید',
            new_relationship: 'رابطه جدید',
            new_area: 'ناحیه جدید',
            new_note: 'یادداشت جدید',
        },

        table_node_context_menu: {
            edit_table: 'ویرایش جدول',
            duplicate_table: 'تکثیر جدول',
            delete_table: 'حذف جدول',
            add_relationship: 'افزودن رابطه',
            move_to_area: 'انتقال به ناحیه',
            no_area: 'بدون ناحیه',
        },

        canvas: {
            all_tables_hidden: 'همه جدول‌ها پنهان هستند',
            show_all_tables: 'نمایش همه',
        },

        canvas_filter: {
            title: 'فیلتر جدول‌ها',
            search_placeholder: 'جست‌وجوی جدول‌ها...',
            group_by_schema: 'گروه‌بندی بر اساس شِما',
            group_by_area: 'گروه‌بندی بر اساس ناحیه',
            no_tables_found: 'جدولی پیدا نشد',
            empty_diagram_description: 'برای شروع یک جدول بسازید',
            no_tables_description: 'جست‌وجو یا فیلتر را تغییر دهید',
            clear_filter: 'پاک کردن فیلتر',
        },

        snap_to_grid_tooltip: 'چسباندن به شبکه (نگه داشتن {{key}})',

        tool_tips: {
            double_click_to_edit: 'برای ویرایش دوبار کلیک کنید',
        },

        language_select: {
            change_language: 'زبان',
        },

        on: 'روشن',
        off: 'خاموش',
    },
};

export const faMetadata: LanguageMetadata = {
    name: 'Persian',
    nativeName: 'فارسی',
    code: 'fa',
};
