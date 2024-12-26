import type { LanguageMetadata } from '../types';

export const ar = {
    translation: {
        menu: {
            file: {
                file: 'ملف',
                new: 'جديد',
                open: 'فتح',
                save: 'حفظ',
                import_database: 'استيراد قاعدة بيانات',
                export_sql: 'تصدير SQL',
                export_as: 'تصدير كـ',
                delete_diagram: 'حذف المخطط',
                exit: 'خروج',
            },
            edit: {
                edit: 'تحرير',
                undo: 'تراجع',
                redo: 'إعادة',
                clear: 'مسح',
            },
            view: {
                view: 'عرض',
                show_sidebar: 'إظهار الشريط الجانبي',
                hide_sidebar: 'إخفاء الشريط الجانبي',
                hide_cardinality: 'إخفاء تفاصيل العلاقات',
                show_cardinality: 'إظهار تفاصيل العلاقات',
                zoom_on_scroll: 'التكبير عند التمرير',
                theme: 'المظهر',
                show_dependencies: 'إظهار الاعتمادات',
                hide_dependencies: 'إخفاء الاعتمادات',
            },
            share: {
                share: 'مشاركة',
                export_diagram: 'تصدير المخطط',
                import_diagram: 'استيراد المخطط',
            },
            help: {
                help: 'مساعدة',
                visit_website: 'زيارة CHARTDB.IO',
                join_discord: 'الانضمام إلى ديسكورد',
                schedule_a_call: 'تواصل معنا!',
            },
        },

        delete_diagram_alert: {
            title: 'حذف المخطط',
            description:
                'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المخطط بشكل دائم.',
            cancel: 'إلغاء',
            delete: 'حذف',
        },

        clear_diagram_alert: {
            title: 'Clear Diagram',
            description:
                'هذا الإجراء لا يمكن التراجع عنه. سيتم مسح جميع البيانات في المخطط بشكل دائم.',
            cancel: 'إلغاء',
            clear: 'مسح',
        },

        reorder_diagram_alert: {
            title: 'ترتيب المخطط',
            description:
                'هذا الإجراء سيقوم بترتيب الجداول في المخطط بشكل تلقائي. هل تريد المتابعة؟',
            reorder: 'ترتيب',
            cancel: 'إلغاء',
        },

        multiple_schemas_alert: {
            title: 'Multiple Schemas (نظم متعددة)',
            description:
                '{{schemasCount}} النظم في هذا المخطط. تعرض حالياً: {{formattedSchemas}}.',
            dont_show_again: 'لا تظهره مجدداً',
            change_schema: 'تغيير النظام',
            none: 'لا شيء',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'فشل النسخ',
                description: 'النسخ إلى الحافظة غير مدعوم في هذا المتصفح.',
            },
            failed: {
                title: 'فشل النسخ',
                description: 'حدث خطأ أثناء النسخ. حاول مجدداً',
            },
        },

        theme: {
            system: 'النظام',
            light: 'فاتح',
            dark: 'داكن',
        },

        zoom: {
            on: 'تشغيل',
            off: 'إيقاف',
        },

        last_saved: 'آخر حفظ',
        saved: 'تم الحفظ',
        loading_diagram: 'جاري تحميل المخطط...',
        deselect_all: 'إلغاء تحديد الكل',
        select_all: 'تحديد الكل',
        clear: 'مسح',
        show_more: 'عرض المزيد',
        show_less: 'عرض أقل',
        copy_to_clipboard: 'نسخ إلى الحافظة',
        copied: 'تم النسخ',

        side_panel: {
            schema: 'النظام(Schema):',
            filter_by_schema: 'تصفية حسب النظام...',
            search_schema: 'البحث عن النظام...',
            no_schemas_found: 'لم يتم العثور على نظم',
            view_all_options: 'عرض جميع الخيارات...',
            tables_section: {
                tables: 'الجداول',
                add_table: 'إضافة جدول',
                filter: 'تصفية',
                collapse: 'طي الكل',

                table: {
                    fields: 'الحقول',
                    nullable: 'Nullable?',
                    primary_key: 'Primary Key',
                    indexes: 'Indexes',
                    comments: 'تعليقات',
                    no_comments: 'لا توجد تعليقات',
                    add_field: 'إضافة حقل',
                    add_index: 'إضافة Index',
                    index_select_fields: 'حدد الحقول',
                    no_types_found: 'لا يوجد أنواع',
                    field_name: 'الإسم',
                    field_type: 'النوع',
                    field_actions: {
                        title: 'Field Attributes',
                        unique: 'Unique',
                        comments: 'تعليقات',
                        no_comments: 'لا يوجد تعليقات',
                        delete_field: 'حذف الحقل',
                    },
                    index_actions: {
                        title: 'Index Attributes',
                        name: 'الإسم',
                        unique: 'Unique',
                        delete_index: 'حذف Index',
                    },
                    table_actions: {
                        title: 'إجراءات الجدول',
                        change_schema: 'تغيير النظام',
                        add_field: 'إضافة حقل',
                        add_index: 'إضافة Index',
                        duplicate_table: 'نسخ الجدول',
                        delete_table: 'حذف الجدول',
                    },
                },
                empty_state: {
                    title: 'لا توجد جداول',
                    description: 'إنشاء جدول للبدء',
                },
            },
            relationships_section: {
                relationships: 'العلاقات',
                filter: 'تصفية',
                add_relationship: 'إضافة علاقة',
                collapse: 'طي الكل',
                relationship: {
                    primary: 'الجدول الأساسي',
                    foreign: 'الجدول المرتبط',
                    cardinality: 'تفاصيل العلاقة',
                    delete_relationship: 'حذف',
                    relationship_actions: {
                        title: 'إجراءات',
                        delete_relationship: 'حذف',
                    },
                },
                empty_state: {
                    title: 'لا توجد علاقات',
                    description: 'إنشاء علاقة للبدء',
                },
            },
            dependencies_section: {
                dependencies: 'الاعتمادات',
                filter: 'تصفية',
                collapse: 'طي الكل',
                dependency: {
                    table: 'الجدول',
                    dependent_table: 'عرض الاعتمادات',
                    delete_dependency: 'حذف',
                    dependency_actions: {
                        title: 'إجراءات',
                        delete_dependency: 'حذف',
                    },
                },
                empty_state: {
                    title: 'لا توجد اعتمادات',
                    description: 'إنشاء اعتماد للبدء',
                },
            },
        },

        toolbar: {
            zoom_in: 'تكبير',
            zoom_out: 'تصغير',
            save: 'حفظ',
            show_all: 'عرض الكل',
            undo: 'تراجع',
            redo: 'إعادة',
            reorder_diagram: 'ترتيب المخطط',
            highlight_overlapping_tables: 'تسليط الضوء على الجداول المتداخلة',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'ما هو نوع قاعدة البيانات الخاصة بك؟',
                description:
                    'تتمتع كل قاعدة بيانات بمميزاتها وقدراتها الفريدة.',
                check_examples_long: 'ألقي نظرة على الأمثلة',
                check_examples_short: 'أمثلة',
            },

            import_database: {
                title: 'إسترد قاعدة بياناتك',
                database_edition: 'إصدار قاعدة البيانات:',
                step_1: 'قم بتشغيل البرنامج النصي التالي في قاعدة بياناتك:',
                step_2: 'إلصق نتيجة البرنامج النصي هنا:',
                script_results_placeholder: 'نتيجة البرنامج النصي هنا...',
                ssms_instructions: {
                    button_text: 'تعليمات SSMS',
                    title: 'تعليمات',
                    step_1: 'Go to Tools > Options > Query Results > SQL Server.',
                    step_2: 'If you\'re using "Results to Grid," change the Maximum Characters Retrieved for Non-XML data (set to 9999999).',
                },
                instructions_link: 'تحتاج مساعدة؟ شاهد الفيديو',
                check_script_result: 'تحقق من نتيجة البرنامج النصي',
            },

            cancel: 'إلغاء',
            import_from_file: 'استيراد من ملف',
            back: 'السابق',
            empty_diagram: 'مخطط فارغ',
            continue: 'متابعة',
            import: 'استيراد',
        },

        open_diagram_dialog: {
            title: 'فتح مخطط',
            description: 'اختر مخططًا لفتحه',
            table_columns: {
                name: 'الإسم',
                created_at: 'تاريخ الإنشاء',
                last_modified: 'آخر تعديل',
                tables_count: 'عدد الجداول',
            },
            cancel: 'إلغاء',
            open: 'فتح',
        },

        export_sql_dialog: {
            title: 'تصدير SQL',
            description: 'استخرج نظام قاعدة بياناتك إالى كود {{databaseType}}',
            close: 'إغلاق',
            loading: {
                text: 'الذكاء الاصطناعي يقوم بتوليد كود SQL لـ {{databaseType}}...',
                description: 'هذا قد يستغرق 30 ثانية',
            },
            error: {
                message:
                    'حدث خطأ أثناء تصدير الكود. يرجى المحاولة مرة أخرى أو  <0>التواصل معنا</0>.',
                description:
                    'يمكنك استخدام OPENAI_TOKEN الخاص بك , اتطلع على الإرشادات <0>هنا</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'إنشاء علاقة',
            primary_table: 'الجدول الأساسي',
            primary_field: 'الحقل الأساسي',
            referenced_table: 'الجدول المرتبط',
            referenced_field: 'الحقل المرتبط',
            primary_table_placeholder: 'حدد الجدول',
            primary_field_placeholder: 'حدد الحقل',
            referenced_table_placeholder: 'حدد الجدول',
            referenced_field_placeholder: 'حدد الحقل',
            no_tables_found: 'لم يتم العثور على جداول',
            no_fields_found: 'لم يتم العثور على حقول',
            create: 'إنشاء',
            cancel: 'إلغاء',
        },

        import_database_dialog: {
            title: 'استيراد إلى المخطط الحالي',
            override_alert: {
                title: 'استيراد قاعدة بيانات',
                content: {
                    alert: 'سيؤدي استيراد هذا المخطط إلى التأثير على الجداول والعلاقات الموجودة.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> جداول جديدة سيتم إضافتها.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> علاقات جديدة سيتم إنشائها.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> جداول سيتم الكتابة عليها.',
                    proceed: 'هل تريد المتابعة؟',
                },
                import: 'استيراد',
                cancel: 'إلغاء',
            },
        },

        export_image_dialog: {
            title: 'تصدير الصورة',
            description: 'اختر الدقة لتصدير الصورة:',
            scale_1x: '1x عادي',
            scale_2x: '2x (موصى به)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'إلغاء',
            export: 'تصدير',
        },

        new_table_schema_dialog: {
            title: 'اختر نظاماً (Schema)',
            description:
                'يتم عرض أنظمة (Schemas) متعددة حاليًا. حدد أحدها للجدول الجديد.',
            cancel: 'إلغاء',
            confirm: 'اختيار',
        },

        update_table_schema_dialog: {
            title: 'تغيير النظام (Schema)',
            description: 'تحديث نظام (Schema) لجدول: "{{tableName}}"',
            cancel: 'إلغاء',
            confirm: 'تغيير',
        },

        star_us_dialog: {
            title: 'ساعدنا على التحسين!',
            description:
                'هل ترغب في منحنا نجمة على GitHub؟ كل ما عليك فعله هو نقرة واحدة فقط!',
            close: 'ليس الآن',
            confirm: 'بالتأكيد!',
        },
        export_diagram_dialog: {
            title: 'تصدير المخطط',
            description: 'اختر التنسيق للتصدير:',
            format_json: 'JSON',
            cancel: 'إلغاء',
            export: 'تصدير',
            error: {
                title: 'حدث خطأ أثناء التصدير',
                description:
                    'حدث خطأ ما. هل تحتاج إلى مساعدة؟ chartdb.io@gmail.com',
            },
        },

        import_diagram_dialog: {
            title: 'استيراد المخطط',
            description: 'قم بلصق JSON المخطط هنا:',
            cancel: 'إلغاء',
            import: 'استيراد',
            error: {
                title: 'حدث خطأ أثناء الاستيراد',
                description:
                    'كود JSON للمخطط غير صالح. من فضلك تحقق من صحته وحاول مرة أخرى. هل تحتاج إلى مساعدة؟ chartdb.io@gmail.com',
            },
        },
        relationship_type: {
            one_to_one: 'One to One',
            one_to_many: 'One to Many',
            many_to_one: 'Many to One',
            many_to_many: 'Many to Many',
        },

        canvas_context_menu: {
            new_table: 'جدول جديد',
            new_relationship: 'علاقة جديدة',
        },

        table_node_context_menu: {
            edit_table: 'تعديل الجدول',
            duplicate_table: 'نسخ الجدول',
            delete_table: 'حذف الجدول',
        },

        snap_to_grid_tooltip: 'مغنطة الشبكة (انقر مطولاً على {{key}})',

        tool_tips: {
            double_click_to_edit: 'انقر نقرًا مزدوجًا للتحرير',
        },

        language_select: {
            change_language: 'تغيير اللغة',
        },
    },
};

export const arMetadata: LanguageMetadata = {
    name: 'Arabic',
    nativeName: 'العربية',
    code: 'ar',
};
