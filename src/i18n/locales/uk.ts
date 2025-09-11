import type { LanguageMetadata, LanguageTranslation } from '../types';

export const uk: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Нова',
            browse: 'Огляд',
            tables: 'Таблиці',
            refs: 'Зв’язки',
            areas: 'Області',
            dependencies: 'Залежності',
            custom_types: 'Користувацькі типи',
        },
        menu: {
            actions: {
                actions: 'Дії',
                new: 'Нова...',
                browse: 'Огляд...',
                save: 'Зберегти',
                import: 'Імпорт бази даних',
                export_sql: 'Експорт SQL',
                export_as: 'Експортувати як',
                delete_diagram: 'Видалити',
            },
            edit: {
                edit: 'Редагувати',
                undo: 'Скасувати',
                redo: 'Повторити',
                clear: 'Очистити',
            },
            view: {
                view: 'Перегляд',
                show_sidebar: 'Показати бічну панель',
                hide_sidebar: 'Приховати бічну панель',
                hide_cardinality: 'Приховати потужність',
                show_cardinality: 'Показати кардинальність',
                show_field_attributes: 'Показати атрибути полів',
                hide_field_attributes: 'Приховати атрибути полів',
                zoom_on_scroll: 'Масштабувати прокручуванням',
                show_views: 'Представлення бази даних',
                theme: 'Тема',
                show_dependencies: 'Показати залежності',
                hide_dependencies: 'Приховати залежності',
                show_minimap: 'Показати мінімапу',
                hide_minimap: 'Приховати мінімапу',
            },
            backup: {
                backup: 'Резервне копіювання',
                export_diagram: 'Експорт діаграми',
                restore_diagram: 'Відновити діаграму',
            },
            help: {
                help: 'Довідка',
                docs_website: 'Документація',
                join_discord: 'Приєднуйтесь до нас в Діскорд',
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
            title: 'Очистити діаграму',
            description:
                'Цю дію не можна скасувати. Це назавжди видалить усі дані на діаграмі.',
            cancel: 'Скасувати',
            clear: 'Очистити',
        },

        reorder_diagram_alert: {
            title: 'Автоматичне розміщення діаграми',
            description:
                'Ця дія перевпорядкує всі таблиці на діаграмі. Хочете продовжити?',
            reorder: 'Автоматичне розміщення',
            cancel: 'Скасувати',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Помилка копіювання',
                description: 'Буфер обміну не підтримується',
            },
            failed: {
                title: 'Помилка копіювання',
                description: 'Щось пішло не так. Будь ласка, спробуйте ще раз.',
            },
        },

        theme: {
            system: 'Системна',
            light: 'Світла',
            dark: 'Темна',
        },

        zoom: {
            on: 'Увімкнути',
            off: 'Вимкнути',
        },

        last_saved: 'Востаннє збережено',
        saved: 'Збережено',
        loading_diagram: 'Завантаження діаграми…',
        deselect_all: 'Зняти виділення з усіх',
        select_all: 'Вибрати усі',
        clear: 'Очистити',
        show_more: 'Показати більше',
        show_less: 'Показати менше',
        copy_to_clipboard: 'Копіювати в буфер обміну',
        copied: 'Скопійовано!',

        share_table_dialog: {
            title: 'Поділитися таблицею',
            description:
                'Скопіюйте посилання нижче, щоб поділитися цією таблицею.',
            close: 'Закривати',
        },

        side_panel: {
            view_all_options: 'Переглянути всі параметри…',
            tables_section: {
                tables: 'Таблиці',
                add_table: 'Додати таблицю',
                add_view: 'Додати представлення',
                filter: 'Фільтр',
                collapse: 'Згорнути все',
                clear: 'Прозорий фільтр',
                no_results:
                    'Жодних таблиць не знайдено, що відповідає вашому фільтра.',
                show_list: 'Показати список таблиць',
                show_dbml: 'Показати редактор DBML',

                table: {
                    fields: 'Поля',
                    nullable: 'Може бути Null?',
                    primary_key: 'Первинний ключ',
                    indexes: 'Індекси',
                    comments: 'Коментарі',
                    no_comments: 'Немає коментарів',
                    add_field: 'Додати поле',
                    add_index: 'Додати індекс',
                    index_select_fields: 'Виберіть поля',
                    no_types_found: 'Типи не знайдено',
                    field_name: 'Назва поля',
                    field_type: 'Тип',
                    field_actions: {
                        title: 'Атрибути полів',
                        unique: 'Унікальне',
                        auto_increment: 'Автоінкремент',
                        comments: 'Коментарі',
                        no_comments: 'Немає коментарів',
                        delete_field: 'Видалити поле',
                        default_value: 'Default Value',
                        no_default: 'No default',
                        character_length: 'Max Length',
                        precision: 'Точність',
                        scale: 'Масштаб',
                    },
                    index_actions: {
                        title: 'Атрибути індексу',
                        name: 'Назва індекса',
                        unique: 'Унікальний',
                        index_type: 'Тип індексу',
                        delete_index: 'Видалити індекс',
                    },
                    table_actions: {
                        title: 'Дії з таблицею',
                        change_schema: 'Змінити схему',
                        add_field: 'Додати поле',
                        add_index: 'Додати індекс',
                        duplicate_table: 'Дублювати таблицю',
                        delete_table: 'Видалити таблицю',
                    },
                },
                empty_state: {
                    title: 'Без таблиць',
                    description: 'Щоб почати, створіть таблицю',
                },
            },
            refs_section: {
                refs: 'Refs',
                filter: 'Фільтр',
                collapse: 'Згорнути все',
                add_relationship: 'Додати звʼязок',
                relationships: 'Звʼязки',
                dependencies: 'Залежності',
                relationship: {
                    relationship: 'Звʼязок',
                    primary: 'Первинна таблиця',
                    foreign: 'Посилання на таблицю',
                    cardinality: 'Звʼязок',
                    delete_relationship: 'Видалити',
                    relationship_actions: {
                        title: 'Дії',
                        delete_relationship: 'Видалити',
                    },
                },
                dependency: {
                    dependency: 'Залежність',
                    table: 'Таблиця',
                    dependent_table: 'Залежне подання',
                    delete_dependency: 'Видалити',
                    dependency_actions: {
                        title: 'Дії',
                        delete_dependency: 'Видалити',
                    },
                },
                empty_state: {
                    title: 'Жодних зв’язків',
                    description: 'Створіть зв’язок, щоб почати',
                },
            },
            areas_section: {
                areas: 'Райони',
                add_area: 'Додати площу',
                filter: 'Фільтрувати',
                clear: 'Прозорий фільтр',
                no_results:
                    'Жодних областей не знайдено, що відповідає вашому фільтра.',

                area: {
                    area_actions: {
                        title: 'Дії області',
                        edit_name: 'Назва редагування',
                        delete_area: 'Видалити площу',
                    },
                },
                empty_state: {
                    title: 'Немає областей',
                    description: 'Створіть область для початку',
                },
            },
            custom_types_section: {
                custom_types: 'Спеціальні типи',
                filter: 'Фільтрувати',
                clear: 'Прозорий фільтр',
                no_results:
                    'Не знайдено спеціальних типів, що відповідають вашому фільтра.',
                empty_state: {
                    title: 'Немає власних типів',
                    description:
                        'Спеціальні типи з’являться тут, коли вони будуть доступні у вашій базі даних',
                },
                custom_type: {
                    kind: 'Вид',
                    enum_values: 'Значення перелічення',
                    composite_fields: 'Поля',
                    no_fields: 'Не визначені поля',
                    no_values: 'Значення переліку не визначені',
                    field_name_placeholder: 'Назва поля',
                    field_type_placeholder: 'Виберіть Тип',
                    add_field: 'Додати поле',
                    no_fields_tooltip:
                        'Не визначені для цього типу полів для цього користувальницького типу',
                    custom_type_actions: {
                        title: 'Дії',
                        highlight_fields: 'Виділіть поля',
                        delete_custom_type: 'Видаляти',
                        clear_field_highlight: 'Чітка родзинка',
                    },
                    delete_custom_type: 'Тип видалення',
                },
            },
        },

        toolbar: {
            zoom_in: 'Збільшити',
            zoom_out: 'Зменшити',
            save: 'Зберегти',
            show_all: 'Показати все',
            undo: 'Скасувати',
            redo: 'Повторити',
            reorder_diagram: 'Автоматичне розміщення діаграми',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'Показати таблиці, що перекриваються',
            filter: 'Filter Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Яка у вас база даних?',
                description:
                    'Кожна база даних має свої унікальні особливості та можливості.',
                check_examples_long: 'Подивіться приклади',
                check_examples_short: 'Приклади',
            },

            import_database: {
                title: 'Імпортуйте вашу базу даних',
                database_edition: 'Варіант бази даних:',
                step_1: 'Запустіть цей сценарій у своїй базі даних:',
                step_2: 'Вставте сюди результат сценарію →',
                script_results_placeholder: 'Результати сценарію має бути тут…',
                ssms_instructions: {
                    button_text: 'SSMS Інструкції',
                    title: 'Інструкції',
                    step_1: 'Перейдіть до Інструменти > Опції > Результати запиту > SQL Сервер.',
                    step_2: 'Якщо ви використовуєте «Results to Grid», змініть максимальну кількість символів, отриманих для даних, що не є XML (встановіть на 9999999).',
                },
                instructions_link: 'Потрібна допомога? Подивіться як',
                check_script_result: 'Перевірте результат сценарію',
            },

            cancel: 'Скасувати',
            back: 'Назад',
            import_from_file: 'Імпортувати з файлу',
            empty_diagram: 'Порожня діаграма',
            continue: 'Продовжити',
            import: 'Імпорт',
        },

        open_diagram_dialog: {
            title: 'Відкрити базу даних',
            description:
                'Виберіть діаграму, яку потрібно відкрити, зі списку нижче.',
            table_columns: {
                name: 'Назва',
                created_at: 'Створено0',
                last_modified: 'Востаннє змінено',
                tables_count: 'Таблиці',
            },
            cancel: 'Скасувати',
            start_new: 'Почати з нової діаграми',
            open: 'Відкрити',

            diagram_actions: {
                open: 'Відкрити',
                duplicate: 'Дублювати',
                delete: 'Видалити',
            },
        },

        export_sql_dialog: {
            title: 'Експорт SQL',
            description:
                'Експортуйте свою схему діаграми в {{databaseType}} сценарій',
            close: 'Закрити',
            loading: {
                text: 'ШІ створює SQL для {{databaseType}}…',
                description: 'Це має зайняти до 30 секунд.',
            },
            error: {
                message:
                    'Помилка створення сценарію SQL. Спробуйте пізніше або <0>звʼяжіться з нами</0>.',
                description:
                    'Не соромтеся використовувати свій OPENAI_TOKEN, дивіться посібник <0>тут</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Створити звʼязок',
            primary_table: 'Первинна таблиця',
            primary_field: 'Первинне поле',
            referenced_table: 'Звʼязана таблиця',
            referenced_field: 'Повʼязане поле',
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
                        '<bold>{{newRelationshipsNumber}}</bold> будуть створені нові звʼязки.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> таблиці будуть перезаписані.',
                    proceed: 'Ви хочете продовжити?',
                },
                import: 'Імпортувати',
                cancel: 'Скасувати',
            },
        },

        export_image_dialog: {
            title: 'Експорт зображення',
            description: 'Виберіть коефіцієнт масштабування для експорту:',
            scale_1x: '1x Звичайний',
            scale_2x: '2x (Рекомендовано)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Скасувати',
            export: 'Експортувати',
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'Виберіть Схему',
            description:
                'Наразі показується кілька схем. Виберіть одну для нової таблиці.',
            cancel: 'Скасувати',
            confirm: 'Підтвердити',
        },

        update_table_schema_dialog: {
            title: 'Змінити схему',
            description: 'Оновити схему таблиці "{{tableName}}"',
            cancel: 'Скасувати',
            confirm: 'Змінити',
        },

        create_table_schema_dialog: {
            title: 'Створити нову схему',
            description:
                'Поки що не існує жодної схеми. Створіть свою першу схему, щоб організувати ваші таблиці.',
            create: 'Створити',
            cancel: 'Скасувати',
        },

        star_us_dialog: {
            title: 'Допоможіть нам покращитися!',
            description: 'Поставне на зірку на GitHub? Це лише один клік!',
            close: 'Не зараз',
            confirm: 'Звісно!',
        },
        export_diagram_dialog: {
            title: 'Експорт Діаграми',
            description: 'Оберіть формат експорту:',
            format_json: 'JSON',
            cancel: 'Скасувати',
            export: 'Експортувати',
            error: {
                title: 'Помилка експорут діаграми',
                description:
                    'Щось пішло не так. Потрібна допомога? support@chartdb.io',
            },
        },
        import_diagram_dialog: {
            title: 'Імпорт Діаграми',
            description: 'Вставте JSON діаграми нижче:',
            cancel: 'Скасувати',
            import: 'Імпортувати',
            error: {
                title: 'Помилка імпорту діаграми',
                description:
                    'JSON діаграми є неправильним. Будь ласка, перевірте JSON і спробуйте ще раз. Потрібна допомога? support@chartdb.io',
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
            one_to_one: 'Один до Одного',
            one_to_many: 'Один до Багатьох',
            many_to_one: 'Багато до Одного',
            many_to_many: 'Багато до Багатьох',
        },

        canvas_context_menu: {
            new_table: 'Нова таблиця',
            new_view: 'Нове представлення',
            new_relationship: 'Новий звʼязок',
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'Редагувати таблицю',
            duplicate_table: 'Дублювати таблицю',
            delete_table: 'Видалити таблицю',
            add_relationship: 'Додати стосунки',
        },

        snap_to_grid_tooltip: 'Вирівнювати за сіткою (Отримуйте {{key}})',

        tool_tips: {
            double_click_to_edit: 'Подвійне клацання для редагування',
        },

        language_select: {
            change_language: 'Мова',
        },

        on: 'Увімк',
        off: 'Вимк',
    },
};

export const ukMetadata: LanguageMetadata = {
    name: 'Ukrainian',
    nativeName: 'Українська',
    code: 'uk',
};
