import type { LanguageMetadata, LanguageTranslation } from '../types';

export const uk: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Файл',
                new: 'Новий',
                open: 'Відкрити',
                save: 'Зберегти',
                import: 'Імпорт бази даних',
                export_sql: 'Експорт SQL',
                export_as: 'Експортувати як',
                delete_diagram: 'Видалити діаграму',
                exit: 'Вийти',
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
                zoom_on_scroll: 'Масштабувати прокручуванням',
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
            title: 'Перевпорядкувати діаграму',
            description:
                'Ця дія перевпорядкує всі таблиці на діаграмі. Хочете продовжити?',
            reorder: 'Перевпорядкувати',
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

        side_panel: {
            schema: 'Схема:',
            filter_by_schema: 'Фільтрувати за схемою',
            search_schema: 'Пошук схеми…',
            no_schemas_found: 'Схеми не знайдено.',
            view_all_options: 'Переглянути всі параметри…',
            tables_section: {
                tables: 'Таблиці',
                add_table: 'Додати таблицю',
                filter: 'Фільтр',
                collapse: 'Згорнути все',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

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
                        comments: 'Коментарі',
                        no_comments: 'Немає коментарів',
                        delete_field: 'Видалити поле',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'Атрибути індексу',
                        name: 'Назва індекса',
                        unique: 'Унікальний',
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
            relationships_section: {
                relationships: 'Звʼязки',
                filter: 'Фільтр',
                add_relationship: 'Додати звʼязок',
                collapse: 'Згорнути все',
                relationship: {
                    primary: 'Первинна таблиця',
                    foreign: 'Посилання на таблицю',
                    cardinality: 'Звʼязок',
                    delete_relationship: 'Видалити',
                    relationship_actions: {
                        title: 'Дії',
                        delete_relationship: 'Видалити',
                    },
                },
                empty_state: {
                    title: 'Звʼязків немає',
                    description: 'Створіть звʼязок для зʼєднання таблиць',
                },
            },
            dependencies_section: {
                dependencies: 'Залежності',
                filter: 'Фільтр',
                collapse: 'Згорнути все',
                dependency: {
                    table: 'Таблиця',
                    dependent_table: 'Залежне подання',
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
            zoom_in: 'Збільшити',
            zoom_out: 'Зменшити',
            save: 'Зберегти',
            show_all: 'Показати все',
            undo: 'Скасувати',
            redo: 'Повторити',
            reorder_diagram: 'Перевпорядкувати діаграму',
            highlight_overlapping_tables: 'Показати таблиці, що перекриваються',
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
                step_2: 'Вставте сюди результат сценарію:',
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
            title: 'Відкрити діаграму',
            description:
                'Виберіть діаграму, яку потрібно відкрити, зі списку нижче.',
            table_columns: {
                name: 'Назва',
                created_at: 'Створено0',
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
            // TODO: Translate
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
            one_to_one: 'Один до Одного',
            one_to_many: 'Один до Багатьох',
            many_to_one: 'Багато до Одного',
            many_to_many: 'Багато до Багатьох',
        },

        canvas_context_menu: {
            new_table: 'Нова таблиця',
            new_relationship: 'Новий звʼязок',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'Редагувати таблицю',
            duplicate_table: 'Дублювати таблицю',
            delete_table: 'Видалити таблицю',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: 'Вирівнювати за сіткою (Отримуйте {{key}})',

        tool_tips: {
            double_click_to_edit: 'Подвійне клацання для редагування',
        },

        language_select: {
            change_language: 'Мова',
        },
    },
};

export const ukMetadata: LanguageMetadata = {
    name: 'Ukrainian',
    nativeName: 'Українська',
    code: 'uk',
};
