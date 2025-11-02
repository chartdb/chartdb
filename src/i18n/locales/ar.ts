import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ar: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'جديد',
            browse: 'تصفح',
            tables: 'الجداول',
            refs: 'المراجع',
            dependencies: 'التبعيات',
            custom_types: 'الأنواع المخصصة',
            visuals: 'مرئيات',
        },
        menu: {
            actions: {
                actions: 'الإجراءات',
                new: 'جديد...',
                browse: 'تصفح...',
                save: 'حفظ',
                import: 'استيراد قاعدة بيانات',
                export_sql: 'SQL تصدير',
                export_as: 'تصدير كـ',
                delete_diagram: 'حذف',
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
                hide_cardinality: 'إخفاء الكاردينالية',
                show_cardinality: 'إظهار الكاردينالية',
                hide_field_attributes: 'إخفاء خصائص الحقل',
                show_field_attributes: 'إظهار خصائص الحقل',
                zoom_on_scroll: 'تكبير/تصغير عند التمرير',
                show_views: 'عروض قاعدة البيانات',
                theme: 'المظهر',
                show_dependencies: 'إظهار الاعتمادات',
                hide_dependencies: 'إخفاء الاعتمادات',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: 'النسخ الاحتياطي',
                export_diagram: 'تصدير المخطط',
                restore_diagram: 'استعادة المخطط',
            },
            help: {
                help: 'مساعدة',
                docs_website: 'الوثائق',
                join_discord: 'انضم إلينا على Discord',
            },
        },

        delete_diagram_alert: {
            title: 'حذف المخطط',
            description:
                '.لا يمكن التراجع عن هذا الإجراء. سيتم حذف الرسم البياني بشكل دائم',
            cancel: 'إلغاء',
            delete: 'حذف',
        },

        clear_diagram_alert: {
            title: 'مسح الرسم البياني',
            description:
                '.لا يمكن التراجع عن هذا الاجراء. سيتم حذف جميع البيانات في الرسم البياني بشكل دائم',
            cancel: 'إلغاء',
            clear: 'مسح',
        },

        reorder_diagram_alert: {
            title: 'ترتيب تلقائي للرسم البياني',
            description:
                'هذا الإجراء سيقوم بإعادة ترتيب الجداول في المخطط بشكل تلقائي. هل تريد المتابعة؟',
            reorder: 'ترتيب تلقائي',
            cancel: 'إلغاء',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'فشل النسخ',
                description: '.الحافظة غير مدعومة',
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
        loading_diagram: '...جارِ تحميل الرسم البياني',
        deselect_all: 'إلغاء تحديد الكل',
        select_all: 'تحديد الكل',
        clear: 'مسح',
        show_more: 'عرض المزيد',
        show_less: 'عرض أقل',
        copy_to_clipboard: 'نسخ إلى الحافظة',
        copied: '!تم النسخ',

        side_panel: {
            view_all_options: '...عرض جميع الخيارات',
            tables_section: {
                tables: 'الجداول',
                add_table: 'إضافة جدول',
                add_view: 'إضافة عرض',
                filter: 'تصفية',
                collapse: 'طي الكل',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'الحقول',
                    nullable: 'يمكن ان يكون فارغاً؟',
                    primary_key: 'المفتاح الأساسي',
                    indexes: 'الفهارس',
                    comments: 'تعليقات',
                    no_comments: 'لا توجد تعليقات',
                    add_field: 'إضافة حقل',
                    add_index: 'إضافة فهرس',
                    index_select_fields: 'حدد الحقول',
                    no_types_found: 'لا يوجد أنواع',
                    field_name: 'الإسم',
                    field_type: 'النوع',
                    field_actions: {
                        title: 'خصائص الحقل',
                        unique: 'فريد',
                        auto_increment: 'زيادة تلقائية',
                        comments: 'تعليقات',
                        no_comments: 'لا يوجد تعليقات',
                        delete_field: 'حذف الحقل',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'الدقة',
                        scale: 'النطاق',
                        default_value: 'Default Value',
                        no_default: 'No default',
                    },
                    index_actions: {
                        title: 'خصائص الفهرس',
                        name: 'الإسم',
                        unique: 'فريد',
                        index_type: 'نوع الفهرس',
                        delete_index: 'حذف الفهرس',
                    },
                    table_actions: {
                        title: 'إجراءات الجدول',
                        change_schema: 'تغيير المخطط',
                        add_field: 'إضافة حقل',
                        add_index: 'إضافة فهرس',
                        duplicate_table: 'نسخ الجدول',
                        delete_table: 'حذف الجدول',
                    },
                },
                empty_state: {
                    title: 'لا توجد جداول',
                    description: 'أنشئ جدولاً للبدء',
                },
            },
            refs_section: {
                refs: 'المراجع',
                filter: 'تصفية',
                collapse: 'طي الكل',
                add_relationship: 'إضافة علاقة',
                relationships: 'العلاقات',
                dependencies: 'الاعتمادات',
                relationship: {
                    relationship: 'العلاقة',
                    primary: 'الجدول الأساسي',
                    foreign: 'الجدول المرتبط',
                    cardinality: 'الكاردينالية',
                    delete_relationship: 'حذف',
                    relationship_actions: {
                        title: 'إجراءات',
                        delete_relationship: 'حذف',
                    },
                },
                dependency: {
                    dependency: 'الاعتماد',
                    table: 'الجدول',
                    dependent_table: 'عرض الاعتمادات',
                    delete_dependency: 'حذف',
                    dependency_actions: {
                        title: 'إجراءات',
                        delete_dependency: 'حذف',
                    },
                },
                empty_state: {
                    title: 'لا توجد علاقات',
                    description: 'إنشاء علاقة للبدء',
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
                visuals: 'مرئيات',
                tabs: {
                    areas: 'Areas',
                    notes: 'ملاحظات',
                },
            },

            notes_section: {
                filter: 'تصفية',
                add_note: 'إضافة ملاحظة',
                no_results: 'لم يتم العثور على ملاحظات',
                clear: 'مسح التصفية',
                empty_state: {
                    title: 'لا توجد ملاحظات',
                    description: 'أنشئ ملاحظة لإضافة تعليقات نصية على اللوحة',
                },
                note: {
                    empty_note: 'ملاحظة فارغة',
                    note_actions: {
                        title: 'إجراءات الملاحظة',
                        edit_content: 'تحرير المحتوى',
                        delete_note: 'حذف الملاحظة',
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
                    no_values: 'لم يتم تحديد قيم التعداد',
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
            zoom_in: 'تكبير',
            zoom_out: 'تصغير',
            save: 'حفظ',
            show_all: 'عرض الكل',
            undo: 'تراجع',
            redo: 'إعادة',
            reorder_diagram: 'ترتيب تلقائي للرسم البياني',
            highlight_overlapping_tables: 'تمييز الجداول المتداخلة',
            // TODO: Translate
            filter: 'Filter Tables',
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
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
                database_edition: ':إصدار قاعدة البيانات',
                step_1: ':قم بتشغيل هذا البرنامج النصي في قاعدة بياناتك',
                step_2: ':إلصق نتيجة البرنامج النصي هنا →',
                script_results_placeholder: '...نتيجة البرنامج النصي هنا',
                ssms_instructions: {
                    button_text: 'SSMS تعليمات',
                    title: 'تعليمات',
                    step_1: 'SQL SERVER < انتقل إلى الأدوات > الخيارات > نتائح الاستعلام',
                    step_2: '(اضبطها على 9999999) XML اذا كنت تستخدم "نتائج إلى الشبكة"، قم بتغيير الحد الاقصى للاحرف المستردة للبيانات غير',
                },
                instructions_link: 'تحتاج مساعدة؟ شاهد الفيديو',
                check_script_result: 'تحقق من نتيجة البرنامج النصي',
            },

            cancel: 'إلغاء',
            import_from_file: 'استيراد من ملف',
            back: 'رجوع',
            empty_diagram: 'قاعدة بيانات فارغة',
            continue: 'متابعة',
            import: 'استيراد',
        },

        open_diagram_dialog: {
            title: 'فتح قاعدة بيانات',
            description: 'اختر مخططًا لفتحه من القائمة ادناه',
            table_columns: {
                name: 'الإسم',
                created_at: 'تاريخ الإنشاء',
                last_modified: 'آخر تعديل',
                tables_count: 'الجداول',
            },
            cancel: 'إلغاء',
            open: 'فتح',

            diagram_actions: {
                open: 'فتح',
                duplicate: 'تكرار',
                delete: 'حذف',
            },
        },

        export_sql_dialog: {
            title: 'SQL تصدير',
            description:
                '{{databaseType}} صدّر مخطط الرسم البياني إلى برنامج نصي لـ',
            close: 'إغلاق',
            loading: {
                text: '...{{databaseType}} ل SQL يقوم الذكاء الاصطناعي بإنشاء',
                description: 'هذا قد يستغرق 30 ثانية',
            },
            error: {
                message:
                    'النصي. يرجى المحاولة مرة اخرى لاحقاً او <0>اتصل بنا</0> SQL خطأ في إنشاء برنامج',
                description:
                    ' الخاصة بك. راجع الدليل <0>هنا</0> OPENAI_TOKEN لا تتردد في استخدام',
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
                    alert: 'سيؤدي استيراد هذا المخطط إلى التأثير على الجداول والعلاقات الحالية.',
                    new_tables:
                        'جداول جديدة <bold>{{newTablesNumber}}</bold> سيتم إضافة',
                    new_relationships:
                        'علاقات جديدة <bold>{{newRelationshipsNumber}}</bold> سيتم إنشاء',
                    tables_override:
                        'جداول <bold>{{tablesOverrideNumber}}</bold> سيتم تعديل',
                    proceed: 'هل تريد المتابعة؟',
                },
                import: 'استيراد',
                cancel: 'إلغاء',
            },
        },

        export_image_dialog: {
            title: 'تصدير الصورة',
            description: ':اختر عامل المقياس للتصدير',
            scale_1x: '1x عادي',
            scale_2x: '2x (موصى به)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'إلغاء',
            export: 'تصدير',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'اختر مخططاً',
            description:
                '.يتم حالياً عرض مخططات متعددة. اختر واحداً للجدول الجديد',
            cancel: 'إلغاء',
            confirm: 'تأكيد',
        },

        update_table_schema_dialog: {
            title: 'تغيير المخطط',
            description: '"{{tableName}}" تحديث مخطط الجدول',
            cancel: 'إلغاء',
            confirm: 'تغيير',
        },
        create_table_schema_dialog: {
            title: 'إنشاء مخطط جديد',
            description:
                'لا توجد مخططات حتى الآن. قم بإنشاء أول مخطط لتنظيم جداولك.',
            create: 'إنشاء',
            cancel: 'إلغاء',
        },

        star_us_dialog: {
            title: '!ساعدنا على التحسن',
            description: '؟! إنها مجرد نقرة واحدةGITHUB هل ترغب في تقييمنا على',
            close: 'ليس الآن',
            confirm: '!بالتأكيد',
        },
        export_diagram_dialog: {
            title: 'تصدير المخطط',
            description: ':اختر التنسيق للتصدير',
            format_json: 'JSON',
            cancel: 'إلغاء',
            export: 'تصدير',
            error: {
                title: 'حدث خطأ أثناء التصدير',
                description:
                    'support@chartdb.io حدث خطأ ما. هل تحتاج إلى مساعدة؟',
            },
        },
        import_diagram_dialog: {
            title: 'استيراد الرسم البياني',
            description: ':للرسم البياني ادناه JSON قم بلصق',
            cancel: 'إلغاء',
            import: 'استيراد',
            error: {
                title: 'حدث خطأ أثناء الاستيراد',
                description:
                    'support@chartdb.io و المحاولة مرة اخرى. هل تحتاج إلى المساعدة؟ JSON غير صالح. يرجى التحقق من JSON الرسم البياني',
            },
        },
        import_dbml_dialog: {
            // TODO: Translate
            title: 'Import DBML',
            example_title: 'Import Example DBML',
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
            one_to_one: 'واحد إلى واحد',
            one_to_many: 'واحد إلى متعدد',
            many_to_one: 'متعدد إلى واحد',
            many_to_many: 'متعدد إلى متعدد',
        },

        canvas_context_menu: {
            new_table: 'جدول جديد',
            new_view: 'عرض جديد',
            new_relationship: 'علاقة جديدة',
            // TODO: Translate
            new_area: 'New Area',
            new_note: 'ملاحظة جديدة',
        },

        table_node_context_menu: {
            edit_table: 'تعديل الجدول',
            duplicate_table: 'نسخ الجدول',
            delete_table: 'حذف الجدول',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: '({{key}} مغنظة الشبكة (اضغط مع الاستمرار على',

        tool_tips: {
            double_click_to_edit: 'انقر مرتين للتعديل',
        },

        language_select: {
            change_language: 'اللغة',
        },
        on: 'تشغيل',
        off: 'إيقاف',
    },
};

export const arMetadata: LanguageMetadata = {
    name: 'Arabic',
    nativeName: 'العربية',
    code: 'ar',
};
