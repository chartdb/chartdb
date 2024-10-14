import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ru: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Файл',
                new: 'Новый',
                open: 'Открыть',
                save: 'Сохранять',
                import_database: 'Импортировать базу данных',
                export_sql: 'Экспорт SQL',
                export_as: 'Экспортировать как',
                delete_diagram: 'Удалить диаграмму',
                exit: 'Выход',
            },
            edit: {
                edit: 'Редактировать',
                undo: 'Отменить',
                redo: 'Переделать',
                clear: 'Прозрачный',
            },
            view: {
                view: 'Вид',
                show_sidebar: 'Показать боковую панель',
                hide_sidebar: 'Скрыть боковую панель',
                hide_cardinality: 'Скрыть мощность',
                show_cardinality: 'Показать мощность',
                zoom_on_scroll: 'Увеличить при прокрутке',
                theme: 'Тема',
                change_language: 'Язык',
                show_dependencies: 'Показать зависимости',
                hide_dependencies: 'Скрыть зависимости',
            },
            help: {
                help: 'Помощь',
                visit_website: 'Посещать ChartDB',
                join_discord: 'Присоединяйтесь к нам в Discord',
                schedule_a_call: 'Поговорите с нами!',
            },
        },

        delete_diagram_alert: {
            title: 'Удалить диаграмму',
            description:
                'Это действие нельзя отменить. Это навсегда удалит диаграмму.',
            cancel: 'Отмена',
            delete: 'Удалить',
        },

        clear_diagram_alert: {
            title: 'Очистить диаграмму',
            description:
                'Это действие нельзя отменить. Это навсегда удалит все данные в диаграмме.',
            cancel: 'Отмена',
            clear: 'Прозрачный',
        },

        reorder_diagram_alert: {
            title: 'Переупорядочить диаграмму',
            description:
                'Это действие переставит все таблицы на диаграмме. Хотите продолжить?',
            reorder: 'Изменить порядок',
            cancel: 'Отмена',
        },

        multiple_schemas_alert: {
            title: 'Множественные схемы',
            description:
                '{{schemasCount}} схем в этой диаграмме. В данный момент отображается: {{formattedSchemas}}.',
            dont_show_again: "Больше не показывать",
            change_schema: 'Изменять',
            none: 'никто',
        },

        theme: {
            system: 'Система',
            light: 'Свет',
            dark: 'Темный',
        },

        zoom: {
            on: 'На',
            off: 'Выключенный',
        },

        last_saved: 'Последнее сохранение',
        saved: 'Сохранено',
        diagrams: 'Диаграммы',
        loading_diagram: 'Загрузка диаграммы...',
        deselect_all: 'Отменить выбор всех',
        select_all: 'Выбрать все',
        clear: 'Прозрачный',
        show_more: 'Показать больше',
        show_less: 'Показать меньше',

        side_panel: {
            schema: 'Схема:',
            filter_by_schema: 'Фильтр по схеме',
            search_schema: 'Схема поиска...',
            no_schemas_found: 'Схемы не найдены.',
            view_all_options: 'Просмотреть все варианты...',
            tables_section: {
                tables: 'Таблицы',
                add_table: 'Добавить таблицу',
                filter: 'Фильтр',
                collapse: 'Свернуть все',

                table: {
                    fields: 'Поля',
                    nullable: 'Обнуляемый?',
                    primary_key: 'Первичный ключ',
                    indexes: 'Индексы',
                    comments: 'Комментарии',
                    no_comments: 'Без комментариев',
                    add_field: 'Добавить поле',
                    add_index: 'Добавить индекс',
                    index_select_fields: 'Выберите поля',
                    no_types_found: 'Типы не найдены',
                    field_name: 'Имя',
                    field_type: 'Тип',
                    field_actions: {
                        title: 'Атрибуты поля',
                        unique: 'Уникальный',
                        comments: 'Комментарии',
                        no_comments: 'Без комментариев',
                        delete_field: 'Удалить поле',
                    },
                    index_actions: {
                        title: 'Атрибуты индекса',
                        name: 'Имя',
                        unique: 'Уникальный',
                        delete_index: 'Удалить индекс',
                    },
                    table_actions: {
                        title: 'Действия таблицы',
                        change_schema: 'Изменить схему',
                        add_field: 'Добавить поле',
                        add_index: 'Добавить индекс',
                        delete_table: 'Удалить таблицу',
                    },
                },
                empty_state: {
                    title: 'Нет таблиц',
                    description: 'Создайте таблицу, чтобы начать',
                },
            },
            relationships_section: {
                relationships: 'Отношения',
                filter: 'Фильтр',
                add_relationship: 'Добавить отношение',
                collapse: 'Свернуть все',
                relationship: {
                    primary: 'Основная таблица',
                    foreign: 'Справочная таблица',
                    cardinality: 'Мощность',
                    delete_relationship: 'Удалить',
                    relationship_actions: {
                        title: 'Действия',
                        delete_relationship: 'Удалить',
                    },
                },
                empty_state: {
                    title: 'Нет отношений',
                    description: 'Создайте связь для соединения таблиц',
                },
            },
            dependencies_section: {
                dependencies: 'Зависимости',
                filter: 'Фильтр',
                collapse: 'Свернуть все',
                dependency: {
                    table: 'Стол',
                    dependent_table: 'Зависимый вид',
                    delete_dependency: 'Удалить',
                    dependency_actions: {
                        title: 'Действия',
                        delete_dependency: 'Удалить',
                    },
                },
                empty_state: {
                    title: 'Нет зависимостей',
                    description: 'Создайте представление, чтобы начать',
                },
            },
        },

        toolbar: {
            zoom_in: 'Увеличить масштаб',
            zoom_out: 'Уменьшить масштаб',
            save: 'Сохранять',
            show_all: 'Показать все',
            undo: 'Отменить',
            redo: 'Переделать',
            reorder_diagram: 'Переупорядочить диаграмму',
            highlight_overlapping_tables: 'Выделение перекрывающихся таблиц',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Какова ваша база данных?',
                description:
                    'Каждая база данных имеет свои уникальные функции и возможности.',
                check_examples_long: 'Проверьте примеры',
                check_examples_short: 'Примеры',
            },

            import_database: {
                title: 'Импортируйте свою базу данных',
                database_edition: 'Редакция базы данных:',
                step_1: 'Запустите этот скрипт в своей базе данных:',
                step_2: 'Вставьте результат скрипта сюда:',
                script_results_placeholder: 'Результаты скрипта здесь...',
                ssms_instructions: {
                    button_text: 'SSMS Инструкции',
                    title: 'Инструкции',
                    step_1: 'Перейти к инструментам > Параметры > Результаты запроса > SQL Сервер.',
                    step_2: 'Если вы используете "Результат в сетке," измените Максимальное количество извлекаемых символов для данных, отличных от XML (установите на 9999999).',
                },
                instructions_link: 'Нужна помощь? Посмотрите, как',
            },

            cancel: 'Отмена',
            back: 'Назад',
            empty_diagram: 'Пустая диаграмма',
            continue: 'Продолжать',
            import: 'Импорт',
        },

        open_diagram_dialog: {
            title: 'Открыть диаграмму',
            description: 'Выберите диаграмму, которую нужно открыть, из списка ниже.',
            table_columns: {
                name: 'Имя',
                created_at: 'Создано в',
                last_modified: 'Последнее изменение',
                tables_count: 'Таблицы',
            },
            cancel: 'Отмена',
            open: 'Открыть',
        },

        export_sql_dialog: {
            title: 'Экспорт SQL',
            description:
                'Экспортируйте схему диаграммы в {{databaseType}} скрипт',
            close: 'Close',
            loading: {
                text: 'ИИ генерирует SQL для {{databaseType}}...',
                description: 'Это должно занять до 30 секунд.',
            },
            error: {
                message:
                    'Ошибка создания скрипта SQL. Попробуйте еще раз позже или <0>свяжитесь с нами</0>.',
                description:
                    'Не стесняйтесь использовать ваш OPENAI_TOKEN, см. руководство <0>здесь</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Создать отношения',
            primary_table: 'Основная таблица',
            primary_field: 'Основное поле',
            referenced_table: 'Справочная таблица',
            referenced_field: 'Ссылочное поле',
            primary_table_placeholder: 'Выбрать таблицу',
            primary_field_placeholder: 'Выберите поле',
            referenced_table_placeholder: 'Выбрать таблицу',
            referenced_field_placeholder: 'Выберите поле',
            no_tables_found: 'Таблицы не найдены',
            no_fields_found: 'Поля не найдены',
            create: 'Создавать',
            cancel: 'Отмена',
        },

        import_database_dialog: {
            title: 'Импорт в текущую диаграмму',
            override_alert: {
                title: 'Импортировать базу данных',
                content: {
                    alert: 'Импорт этой диаграммы повлияет на существующие таблицы и связи.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> будут добавлены новые таблицы.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> будут созданы новые отношения.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> таблицы будут перезаписаны.',
                    proceed: 'Хотите продолжить?',
                },
                import: 'Импорт',
                cancel: 'Отмена',
            },
        },

        export_image_dialog: {
            title: 'Экспортировать изображение',
            description: 'Выберите масштабный коэффициент для экспорта:',
            scale_1x: '1x Обычный',
            scale_2x: '2x (Рекомендовано)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Отмена',
            export: 'Экспорт',
        },

        new_table_schema_dialog: {
            title: 'Выбрать схему',
            description:
                'В настоящее время отображается несколько схем. Выберите одну для новой таблицы.',
            cancel: 'Отмена',
            confirm: 'Подтверждать',
        },

        update_table_schema_dialog: {
            title: 'Изменить схему',
            description: 'Обновить таблицу "{{tableName}}" схема',
            cancel: 'Отмена',
            confirm: 'Изменять',
        },

        star_us_dialog: {
            title: 'Помогите нам стать лучше!',
            description:
                "Хотите отметить нас на GitHub? Это всего лишь один клик!",
            close: 'Не сейчас',
            confirm: 'Конечно!',
        },

        relationship_type: {
            one_to_one: 'Один на один',
            one_to_many: 'Один ко многим',
            many_to_one: 'Многие к одному',
            many_to_many: 'Многие ко многим',
        },

        canvas_context_menu: {
            new_table: 'Новая таблица',
            new_relationship: 'Новые отношения',
        },

        table_node_context_menu: {
            edit_table: 'Редактировать таблицу',
            delete_table: 'Удалить таблицу',
        },
    },
};

export const ruMetadata: LanguageMetadata = {
    name: 'Russian',
    code: 'ru',
};
