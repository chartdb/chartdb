import { LanguageMetadata } from '../types';

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
                delete_diagram: 'حذف الرسم البياني',
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
                hide_cardinality: 'إخفاء التعددية',
                show_cardinality: 'إظهار التعددية',
                zoom_on_scroll: 'التكبير أثناء التمرير',
                theme: 'الثيم',
                change_language: 'اللغة',
            },
            help: {
                help: 'مساعدة',
                visit_website: 'زيارة ChartDB',
                join_discord: 'انضم إلينا على Discord',
                schedule_a_call: 'تحدث معنا!',
            },
        },

        delete_diagram_alert: {
            title: 'حذف الرسم البياني',
            description: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف الرسم البياني نهائيًا.',
            cancel: 'إلغاء',
            delete: 'حذف',
        },

        clear_diagram_alert: {
            title: 'مسح الرسم البياني',
            description: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع البيانات في الرسم البياني نهائيًا.',
            cancel: 'إلغاء',
            clear: 'مسح',
        },

        reorder_diagram_alert: {
            title: 'إعادة ترتيب الرسم البياني',
            description: 'سيتم إعادة ترتيب جميع الجداول في الرسم البياني. هل تريد المتابعة؟',
            reorder: 'إعادة ترتيب',
            cancel: 'إلغاء',
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
        diagrams: 'الرسوم البيانية',
        loading_diagram: 'جارٍ تحميل الرسم البياني...',
        deselect_all: 'إلغاء تحديد الكل',
        select_all: 'تحديد الكل',
        clear: 'مسح',
        show_more: 'عرض المزيد',
        show_less: 'عرض أقل',

        side_panel: {
            schema: 'المخطط:',
            filter_by_schema: 'تصفية حسب المخطط',
            search_schema: 'بحث في المخطط...',
            no_schemas_found: 'لم يتم العثور على مخططات.',
            view_all_options: 'عرض جميع الخيارات...',
            tables_section: {
                tables: 'الجداول',
                add_table: 'إضافة جدول',
                filter: 'تصفية',
                collapse: 'طي الكل',

                table: {
                    fields: 'الحقول',
                    nullable: 'قابل للترك؟',
                    primary_key: 'المفتاح الأساسي',
                    indexes: 'الفهارس',
                    comments: 'تعليقات',
                    no_comments: 'لا توجد تعليقات',
                    add_field: 'إضافة حقل',
                    add_index: 'إضافة فهرس',
                    index_select_fields: 'تحديد الحقول',
                    no_types_found: 'لم يتم العثور على أنواع',
                    field_name: 'الاسم',
                    field_type: 'النوع',
                    field_actions: {
                        title: 'خصائص الحقل',
                        unique: 'فريد',
                        comments: 'تعليقات',
                        no_comments: 'لا توجد تعليقات',
                        delete_field: 'حذف الحقل',
                    },
                    index_actions: {
                        title: 'خصائص الفهرس',
                        name: 'الاسم',
                        unique: 'فريد',
                        delete_index: 'حذف الفهرس',
                    },
                    table_actions: {
                        title: 'إجراءات الجدول',
                        add_field: 'إضافة حقل',
                        add_index: 'إضافة فهرس',
                        delete_table: 'حذف الجدول',
                    },
                },
                empty_state: {
                    title: 'لا توجد جداول',
                    description: 'أنشئ جدولًا للبدء',
                },
            },
            relationships_section: {
                relationships: 'العلاقات',
                filter: 'تصفية',
                add_relationship: 'إضافة علاقة',
                collapse: 'طي الكل',
                relationship: {
                    primary: 'الجدول الأساسي',
                    foreign: 'الجدول المرجعي',
                    cardinality: 'التعددية',
                    delete_relationship: 'حذف',
                    relationship_actions: {
                        title: 'الإجراءات',
                        delete_relationship: 'حذف',
                    },
                },
                empty_state: {
                    title: 'لا توجد علاقات',
                    description: 'أنشئ علاقة لربط الجداول',
                },
            },
        },

        toolbar: {
            zoom_in: 'تكبير',
            zoom_out: 'تصغير',
            save: 'حفظ',
            show_all: 'إظهار الكل',
            undo: 'تراجع',
            redo: 'إعادة',
            reorder_diagram: 'إعادة ترتيب الرسم البياني',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'ما هي قاعدة بياناتك؟',
                description: 'كل قاعدة بيانات لها ميزاتها وقدراتها الفريدة.',
                check_examples_long: 'تحقق من الأمثلة',
                check_examples_short: 'أمثلة',
            },

            import_database: {
                title: 'استيراد قاعدة بياناتك',
                database_edition: 'إصدار قاعدة البيانات:',
                step_1: 'قم بتشغيل هذا السكريبت في قاعدة بياناتك:',
                step_2: 'الصق نتائج السكريبت هنا:',
                script_results_placeholder: 'نتائج السكريبت هنا...',
                ssms_instructions: {
                    button_text: 'تعليمات SSMS',
                    title: 'التعليمات',
                    step_1: 'انتقل إلى Tools > Options > Query Results > SQL Server.',
                    step_2: 'إذا كنت تستخدم "نتائج إلى شبكة"، قم بتغيير الحد الأقصى للأحرف المستردة للبيانات غير XML (اضبط على 9999999).',
                },
            },

            cancel: 'إلغاء',
            back: 'رجوع',
            empty_diagram: 'رسم بياني فارغ',
            continue: 'متابعة',
            import: 'استيراد',
        },

        open_diagram_dialog: {
            title: 'فتح الرسم البياني',
            description: 'اختر رسمًا بيانيًا لفتحه من القائمة أدناه.',
            table_columns: {
                name: 'الاسم',
                created_at: 'تم الإنشاء في',
                last_modified: 'آخر تعديل',
                tables_count: 'الجداول',
            },
            cancel: 'إلغاء',
            open: 'فتح',
        },

        export_sql_dialog: {
            title: 'تصدير SQL',
            description: 'تصدير مخطط الرسم البياني إلى سكريبت {{databaseType}}',
            close: 'إغلاق',
            loading: {
                text: 'الذكاء الصناعي يقوم بإنشاء SQL لـ {{databaseType}}...',
                description: 'قد يستغرق ذلك حتى 30 ثانية.',
            },
            error: {
                message: 'خطأ في إنشاء سكريبت SQL. يرجى المحاولة مرة أخرى لاحقًا أو <0>الاتصال بنا</0>.',
                description: 'لا تتردد في استخدام OPENAI_TOKEN الخاص بك، انظر الدليل <0>هنا</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'إنشاء علاقة',
            primary_table: 'الجدول الأساسي',
            primary_field: 'الحقل الأساسي',
            referenced_table: 'الجدول المرجعي',
            referenced_field: 'الحقل المرجعي',
            primary_table_placeholder: 'اختر جدولاً',
            primary_field_placeholder: 'اختر حقلاً',
            referenced_table_placeholder: 'اختر جدولاً',
            referenced_field_placeholder: 'اختر حقلاً',
            no_tables_found: 'لم يتم العثور على جداول',
            no_fields_found: 'لم يتم العثور على حقول',
            create: 'إنشاء',
            cancel: 'إلغاء',
        },

        import_database_dialog: {
            title: 'استيراد إلى الرسم البياني الحالي',
            override_alert: {
                title: 'استيراد قاعدة بيانات',
                content: {
                    alert: 'سيؤثر استيراد هذا الرسم البياني على الجداول والعلاقات الحالية.',
                    new_tables: '<bold>{{newTablesNumber}}</bold> جداول جديدة ستتم إضافتها.',
                    new_relationships: '<bold>{{newRelationshipsNumber}}</bold> علاقات جديدة ستتم إنشاؤها.',
                    tables_override: '<bold>{{tablesOverrideNumber}}</bold> جداول سيتم الكتابة فوقها.',
                    proceed: 'هل تريد المتابعة؟',
                },
                import: 'استيراد',
                cancel: 'إلغاء',
            },
        },

        relationship_type: {
            one_to_one: 'واحد إلى واحد',
            one_to_many: 'واحد إلى متعدد',
            many_to_one: 'متعدد إلى واحد',
            many_to_many: 'متعدد إلى متعدد',
        },

        canvas_context_menu: {
            new_table: 'جدول جديد',
            new_relationship: 'علاقة جديدة',
        },

        table_node_context_menu: {
            edit_table: 'تحرير الجدول',
            delete_table: 'حذف الجدول',
        },
    },
};

export const arMetadata: LanguageMetadata = {
    name: 'العربية',
    code: 'ar',
};


                  
