import type { LanguageMetadata, LanguageTranslation } from '../types';

export const uk: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'файл',
                new: 'новий',
                open: 'відкрити',
                save: 'зберегти',
                import_database: 'Імпорт бази даних',
                export_sql: 'Експорт SQL',
                export_as: 'Експортувати як',
                delete_diagram: 'Видалити діаграму',
                exit: 'вийти',
            },
            edit: {
                edit: 'редагувати',
                undo: 'Скасувати',
                redo: 'Повторити',
                clear: 'очистити',
            },
            view: {
                view: 'переглянути',
                show_sidebar: 'Показати бічну панель',
                hide_sidebar: 'Приховати бічну панель',
                hide_cardinality: 'Приховати потужність',
                show_cardinality: 'Показати кардинальність',
                zoom_on_scroll: 'Збільшити прокручування',
                theme: 'Тема',
                change_language: 'Мова',
                show_dependencies: 'Показати залежності',
                hide_dependencies: 'Приховати залежності',
            },
            // TODO: Translate
            share: {
                share: 'Share',
                export_diagram: 'Export Diagram',
                import_diagram: 'Import Diagram',
            },
            help: {
                help: 'Допомога',
                visit_website: 'Відвідайте ChartDB',
                join_discord: 'Приєднуйтесь до нас в Діскорд',
                schedule_a_call: 'Поговоріть з нами!',
            },
        },

        delete_diagram_alert: {
            title: 'Видалити діаграму',
            description:
                'Цю дію не можна скасувати. Це призведе до остаточного видалення діаграми.',
            cancel: 'Скасувати',
            delete: 'Видалити',
        },

        clear_diagram_alert: {
            title: 'Чітка діаграма',
            description:
                'Цю дію не можна скасувати. Це назавжди видалить усі дані на діаграмі.',
            cancel: 'Скасувати',
            clear: 'очистити',
        },

        reorder_diagram_alert: {
            title: 'Діаграма зміни порядку',
            description:
                'Ця дія перевпорядкує всі таблиці на діаграмі. Хочете продовжити?',
            reorder: 'Змінити порядок',
            cancel: 'Скасувати',
        },

        multiple_schemas_alert: {
            title: 'Кілька схем',
            description:
                '{{schemasCount}} схеми на цій діаграмі. Зараз відображається: {{formattedSchemas}}.',
            dont_show_again: 'Більше не показувати',
            change_schema: 'Зміна',
            none: 'немає',
        },

        theme: {
            system: 'система',
            light: 'світлий',
            dark: 'Темний',
        },

        zoom: {
            on: 'увімкнути',
            off: 'вимкнути',
        },

        last_saved: 'Востаннє збережено',
        saved: 'Збережено',
        diagrams: 'Діаграми',
        loading_diagram: 'Діаграма завантаження...',
        deselect_all: 'Зняти вибір із усіх',
        select_all: 'Вибрати усі',
        clear: 'Очистити',
        show_more: 'показати більше',
        show_less: 'Показати менше',
        copy_to_clipboard: 'Копіювати в буфер обміну',
        copied: 'Скопійовано!',

        side_panel: {
            schema: 'Схема:',
            filter_by_schema: 'Фільтрувати за схемою',
            search_schema: 'Схема пошуку...',
            no_schemas_found: 'Схеми не знайдено.',
            view_all_options: 'Переглянути всі параметри...',
            tables_section: {
                tables: 'Таблиці',
                add_table: 'Додати таблицю',
                filter: 'фільтр',
                collapse: 'Згорнути все',

                table: {
                    fields: 'поля',
                    nullable: 'Зведений нанівець?',
                    primary_key: 'Первинний ключ',
                    indexes: 'Індекси',
                    comments: 'Коментарі',
                    no_comments: 'Без коментарів',
                    add_field: 'Додати поле',
                    add_index: 'Додати індекс',
                    index_select_fields: 'Виберіть поля',
                    no_types_found: 'Типи не знайдено',
                    field_name: "Ім'я",
                    field_type: 'Тип',
                    field_actions: {
                        title: 'Атрибути полів',
                        unique: 'Унікальний',
                        comments: 'Коментарі',
                        no_comments: 'Без коментарів',
                        delete_field: 'Видалити поле',
                    },
                    index_actions: {
                        title: 'Атрибути індексу',
                        name: "Ім'я",
                        unique: 'Унікальний',
                        delete_index: 'Видалити індекс',
                    },
                    table_actions: {
                        title: 'Дії таблиці',
                        change_schema: 'Змінити схему',
                        add_field: 'Додати поле',
                        add_index: 'Додати індекс',
                        delete_table: 'Видалити таблицю',
                    },
                },
                empty_state: {
                    title: 'Без таблиць',
                    description: 'Щоб почати, створіть таблицю',
                },
            },
            relationships_section: {
                relationships: 'стосунки',
                filter: 'фільтр',
                add_relationship: "Додати зв'язок",
                collapse: 'Згорнути все',
                relationship: {
                    primary: 'Первинна таблиця',
                    foreign: 'Посилання на таблицю',
                    cardinality: 'Кардинальність',
                    delete_relationship: 'Видалити',
                    relationship_actions: {
                        title: 'Дії',
                        delete_relationship: 'Видалити',
                    },
                },
                empty_state: {
                    title: 'Жодних стосунків',
                    description: 'Створіть зв’язок для з’єднання таблиць',
                },
            },
            dependencies_section: {
                dependencies: 'Залежності',
                filter: 'фільтр',
                collapse: 'Згорнути все',
                dependency: {
                    table: 'Таблиця',
                    dependent_table: 'Залежний вид',
                    delete_dependency: 'Видалити',
                    dependency_actions: {
                        title: 'Дії',
                        delete_dependency: 'Видалити',
                    },
                },
                empty_state: {
                    title: 'Жодних залежностей',
                    description: 'Створіть подання, щоб почати',
                },
            },
        },

        toolbar: {
            zoom_in: 'Збільшити',
            zoom_out: 'Зменшити',
            save: 'зберегти',
            show_all: 'Показати все',
            undo: 'Скасувати',
            redo: 'Повторити',
            reorder_diagram: 'Діаграма зміни порядку',
            highlight_overlapping_tables: 'Виділіть таблиці, що перекриваються',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Що таке ваша база даних?',
                description:
                    'Кожна база даних має свої унікальні особливості та можливості.',
                check_examples_long: 'Перевірте приклади',
                check_examples_short: 'Приклади',
            },

            import_database: {
                title: 'Імпортуйте вашу базу даних',
                database_edition: 'Редакція бази даних:',
                step_1: 'Запустіть цей сценарій у своїй базі даних:',
                step_2: 'Вставте сюди результат сценарію:',
                script_results_placeholder: 'Результати сценарію тут...',
                ssms_instructions: {
                    button_text: 'SSMS Інструкції',
                    title: 'Інструкції',
                    step_1: 'Перейдіть до Інструменти > Опції > Результати запиту > SQL Сервер.',
                    step_2: 'Якщо ви використовуєте «Результати в сітку», змініть максимальну кількість символів, отриманих для даних, що не є XML (встановіть на 9999999).',
                },
                instructions_link: 'Потрібна допомога? Подивіться як',
                check_script_result: 'Перевірте результат сценарію',
            },

            cancel: 'Скасувати',
            back: 'Назад',
            // TODO: Translate
            import_from_file: 'Import from File',
            empty_diagram: 'Порожня діаграма',
            continue: 'Продовжити',
            import: 'Імпорт',
        },

        open_diagram_dialog: {
            title: 'Відкрита діаграма',
            description:
                'Виберіть діаграму, яку потрібно відкрити, зі списку нижче.',
            table_columns: {
                name: "Ім'я",
                created_at: 'Створено в',
                last_modified: 'Востаннє змінено',
                tables_count: 'Таблиці',
            },
            cancel: 'Скасувати',
            open: 'Відкрити',
        },

        export_sql_dialog: {
            title: 'Експорт SQL',
            description:
                'Експортуйте свою схему діаграми в {{databaseType}} сценарій',
            close: 'Закрити',
            loading: {
                text: 'ШІ створює SQL для {{databaseType}}...',
                description: 'Це має зайняти до 30 секунд.',
            },
            error: {
                message:
                    "Помилка створення сценарію SQL. Спробуйте пізніше або <0>зв'яжіться з нами</0>.",
                description:
                    'Не соромтеся використовувати свій OPENAI_TOKEN, дивіться посібник <0>тут</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Створити відносини',
            primary_table: 'Первинна таблиця',
            primary_field: 'Первинне поле',
            referenced_table: 'Посилання на таблицю',
            referenced_field: 'Поле посилання',
            primary_table_placeholder: 'Виберіть таблицю',
            primary_field_placeholder: 'Виберіть поле',
            referenced_table_placeholder: 'Виберіть таблицю',
            referenced_field_placeholder: 'Виберіть поле',
            no_tables_found: 'Таблиці не знайдено',
            no_fields_found: 'Поля не знайдено',
            create: 'Створити',
            cancel: 'Скасувати',
        },

        import_database_dialog: {
            title: 'Імпорт до поточної діаграми',
            override_alert: {
                title: 'Імпорт бази даних',
                content: {
                    alert: 'Імпортування цієї діаграми вплине на наявні таблиці та зв’язки.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> будуть додані нові таблиці.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> будуть створені нові відносини.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> таблиці будуть перезаписані.',
                    proceed: 'Ви хочете продовжити?',
                },
                import: 'Імпорт',
                cancel: 'Скасувати',
            },
        },

        export_image_dialog: {
            title: 'Експорт зображення',
            description: 'Виберіть коефіцієнт масштабування для експорту:',
            scale_1x: '1x Регулярний',
            scale_2x: '2x (Рекомендовано)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Скасувати',
            export: 'Експорт',
        },

        new_table_schema_dialog: {
            title: 'Виберіть Схему',
            description:
                'Наразі відображається кілька схем. Виберіть один для нової таблиці.',
            cancel: 'Скасувати',
            confirm: 'Підтвердити',
        },

        update_table_schema_dialog: {
            title: 'Змінити схему',
            description: 'Оновити таблицю "{{tableName}}" схему',
            cancel: 'Скасувати',
            confirm: 'Змінити',
        },

        star_us_dialog: {
            title: 'Допоможіть нам покращитися!',
            description: 'Хочете позначити нас на Ґітхаб? Це лише один клік!',
            close: 'Не зараз',
            confirm: 'звичайно!',
        },
        // TODO: Translate
        export_diagram_dialog: {
            title: 'Export Diagram',
            description: 'Choose the format for export:',
            format_json: 'JSON',
            cancel: 'Cancel',
            export: 'Export',
        },
        // TODO: Translate
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
            one_to_one: 'Один до одного',
            one_to_many: 'Один до багатьох',
            many_to_one: 'Багато до одного',
            many_to_many: 'Багато до багатьох',
        },

        canvas_context_menu: {
            new_table: 'Нова таблиця',
            new_relationship: 'Нові стосунки',
        },

        table_node_context_menu: {
            edit_table: 'Редагувати таблицю',
            delete_table: 'Видалити таблицю',
        },

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'Двойной клик для редактирования',
        },
    },
};

export const ukMetadata: LanguageMetadata = {
    name: 'Українська',
    code: 'uk',
};
