import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ru: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Новая',
            browse: 'Обзор',
            tables: 'Таблицы',
            refs: 'Ссылки',
            dependencies: 'Зависимости',
            custom_types: 'Пользовательские типы',
            visuals: 'Визуальные элементы',
        },
        menu: {
            actions: {
                actions: 'Действия',
                new: 'Новая...',
                browse: 'Обзор...',
                save: 'Сохранить',
                import: 'Импортировать базу данных',
                export_sql: 'Экспорт SQL',
                export_as: 'Экспортировать как',
                delete_diagram: 'Удалить',
            },
            edit: {
                edit: 'Изменение',
                undo: 'Отменить',
                redo: 'Вернуть',
                clear: 'Очистить',
            },
            view: {
                view: 'Вид',
                show_sidebar: 'Показать боковую панель',
                hide_sidebar: 'Скрыть боковую панель',
                hide_cardinality: 'Скрыть виды связи',
                show_cardinality: 'Показать виды связи',
                show_field_attributes: 'Показать атрибуты поля',
                hide_field_attributes: 'Скрыть атрибуты поля',
                zoom_on_scroll: 'Увеличение при прокрутке',
                show_views: 'Представления базы данных',
                theme: 'Тема',
                show_dependencies: 'Показать зависимости',
                hide_dependencies: 'Скрыть зависимости',
                show_minimap: 'Показать мини-карту',
                hide_minimap: 'Скрыть мини-карту',
            },
            backup: {
                backup: 'Бэкап',
                export_diagram: 'Экспорт диаграммы',
                restore_diagram: 'Восстановить диаграмму',
            },
            help: {
                help: 'Помощь',
                docs_website: 'Документация',
                join_discord: 'Присоединиться к сообществу в Discord',
            },
        },

        delete_diagram_alert: {
            title: 'Удалить диаграмму',
            description:
                'Это действие нельзя отменить. Это навсегда удалит диаграмму.',
            cancel: 'Отменить',
            delete: 'Удалить',
        },

        clear_diagram_alert: {
            title: 'Очистить диаграмму',
            description:
                'Это действие нельзя отменить. Это навсегда удалит все данные в диаграмме.',
            cancel: 'Отменить',
            clear: 'Очистить',
        },

        reorder_diagram_alert: {
            title: 'Автоматическая расстановка диаграммы',
            description:
                'Это действие переставит все таблицы на диаграмме. Хотите продолжить?',
            reorder: 'Автоматическая расстановка',
            cancel: 'Отменить',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Ошибка копирования',
                description: 'Буфер обмена не поддерживается',
            },
            failed: {
                title: 'Ошибка копирования',
                description:
                    'Что-то пошло не так. Пожалуйста, попробуйте еще раз.',
            },
        },

        theme: {
            system: 'Системная',
            light: 'Светлая',
            dark: 'Темная',
        },

        zoom: {
            on: 'Включено',
            off: 'Выключено',
        },

        last_saved: 'Последнее сохранение',
        saved: 'Сохранено',
        loading_diagram: 'Загрузка диаграммы...',
        deselect_all: 'Отменить выбор всех',
        select_all: 'Выбрать все',
        clear: 'Очистить',
        show_more: 'Показать больше',
        show_less: 'Показать меньше',

        side_panel: {
            view_all_options: 'Просмотреть все варианты...',
            tables_section: {
                tables: 'Таблицы',
                add_table: 'Добавить таблицу',
                add_view: 'Добавить представление',
                filter: 'Фильтр',
                collapse: 'Свернуть все',
                clear: 'Очистить фильтр',

                no_results:
                    'Таблицы не найдены, соответствующие вашему фильтру.',
                show_list: 'Переключиться на список таблиц',
                show_dbml: 'Переключиться на редактор DBML',

                table: {
                    fields: 'Поля',
                    nullable: 'Может быть NULL?',
                    primary_key: 'Первичный ключ',
                    indexes: 'Индексы',
                    comments: 'Комментарии',
                    no_comments: 'Нет комментария',
                    add_field: 'Добавить поле',
                    add_index: 'Добавить индекс',
                    index_select_fields: 'Выберите поля',
                    no_types_found: 'Типы не найдены',
                    field_name: 'Имя',
                    field_type: 'Тип',
                    field_actions: {
                        title: 'Атрибуты поля',
                        unique: 'Уникальный',
                        auto_increment: 'Автоинкремент',
                        comments: 'Комментарии',
                        no_comments: 'Нет комментария',
                        delete_field: 'Удалить поле',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        character_length: 'Макс. длина',
                        precision: 'Точность',
                        scale: 'Масштаб',
                    },
                    index_actions: {
                        title: 'Атрибуты индекса',
                        name: 'Имя',
                        unique: 'Уникальный',
                        index_type: 'Тип индекса',
                        delete_index: 'Удалить индекс',
                    },
                    table_actions: {
                        title: 'Действия',
                        change_schema: 'Изменить схему',
                        add_field: 'Добавить поле',
                        add_index: 'Добавить индекс',
                        duplicate_table: 'Создать копию',
                        delete_table: 'Удалить таблицу',
                    },
                },
                empty_state: {
                    title: 'Нет таблиц',
                    description: 'Создайте таблицу, чтобы начать',
                },
            },
            refs_section: {
                refs: 'Ссылки',
                filter: 'Фильтр',
                collapse: 'Свернуть все',
                add_relationship: 'Добавить отношение',
                relationships: 'Отношения',
                dependencies: 'Зависимости',
                relationship: {
                    relationship: 'Отношение',
                    primary: 'Основная таблица',
                    foreign: 'Справочная таблица',
                    cardinality: 'Тип множественной связи',
                    delete_relationship: 'Удалить',
                    relationship_actions: {
                        title: 'Действия',
                        delete_relationship: 'Удалить',
                    },
                },
                dependency: {
                    dependency: 'Зависимость',
                    table: 'Таблица',
                    dependent_table: 'Зависимое представление',
                    delete_dependency: 'Удалить',
                    dependency_actions: {
                        title: 'Действия',
                        delete_dependency: 'Удалить',
                    },
                },
                empty_state: {
                    title: 'Нет отношений',
                    description: 'Создайте отношение, чтобы начать',
                },
            },

            areas_section: {
                areas: 'Области',
                add_area: 'Добавить область',
                filter: 'Фильтр',
                clear: 'Очистить фильтр',

                no_results:
                    'Области не найдены, соответствующие вашему фильтру.',

                area: {
                    area_actions: {
                        title: 'Действия',
                        edit_name: 'Изменить название',
                        delete_area: 'Удалить область',
                    },
                },
                empty_state: {
                    title: 'Нет областей',
                    description: 'Создайте область, чтобы начать',
                },
            },

            visuals_section: {
                visuals: 'Визуальные элементы',
                tabs: {
                    areas: 'Области',
                    notes: 'Заметки',
                },
            },

            notes_section: {
                filter: 'Фильтр',
                add_note: 'Добавить Заметку',
                no_results: 'Заметки не найдены',
                clear: 'Очистить Фильтр',
                empty_state: {
                    title: 'Нет Заметок',
                    description:
                        'Создайте заметку, чтобы добавить текстовые аннотации на холсте',
                },
                note: {
                    empty_note: 'Пустая заметка',
                    note_actions: {
                        title: 'Действия с Заметкой',
                        edit_content: 'Редактировать Содержимое',
                        delete_note: 'Удалить Заметку',
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
                    no_values: 'Значения перечисления не определены',
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
            zoom_in: 'Увеличить масштаб',
            zoom_out: 'Уменьшить масштаб',
            save: 'Сохранить',
            show_all: 'Показать все',
            undo: 'Отменить',
            redo: 'Вернуть',
            reorder_diagram: 'Автоматическая расстановка диаграммы',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'Выделение перекрывающихся таблиц',
            // TODO: Translate
            filter: 'Filter Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Какова ваша база данных?',
                description:
                    'Каждая база данных имеет свои уникальные функции и возможности.',
                check_examples_long: 'Открыть примеры',
                check_examples_short: 'Примеры',
            },

            import_database: {
                title: 'Импортируйте свою базу данных',
                database_edition: 'Версия базы данных:',
                step_1: 'Запустите этот скрипт в своей базе данных:',
                step_2: 'Вставьте вывод скрипта сюда →',
                script_results_placeholder: 'Вывод скрипта здесь...',
                ssms_instructions: {
                    button_text: 'SSMS Инструкции',
                    title: 'Инструкции',
                    step_1: 'Откройте в меню пункты Инструменты > Параметры > Результаты запроса > SQL Сервер.',
                    step_2: 'Если вы используете "Результат в сетке," измените Максимальное количество извлекаемых символов для данных, отличных от XML (установите на 9999999).',
                },
                instructions_link: 'Нужна помощь? Посмотрите, как',
                check_script_result: 'Проверить результат выполнения скрипта',
            },

            cancel: 'Отменить',
            back: 'Назад',
            import_from_file: 'Импортировать из файла',
            empty_diagram: 'Пустая база данных',
            continue: 'Продолжить',
            import: 'Импорт',
        },

        open_diagram_dialog: {
            title: 'Открыть базу данных',
            description:
                'Выберите диаграмму, которую нужно открыть, из списка ниже.',
            table_columns: {
                name: 'Имя',
                created_at: 'Создано в',
                last_modified: 'Последнее изменение',
                tables_count: 'Таблицы',
            },
            cancel: 'Отмена',
            open: 'Открыть',

            diagram_actions: {
                open: 'Открыть',
                duplicate: 'Дублировать',
                delete: 'Удалить',
            },
        },

        export_sql_dialog: {
            title: 'Экспорт SQL',
            description:
                'Экспортируйте схему диаграммы в {{databaseType}} скрипт',
            close: 'Закрыть',
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
            title: 'Создать отношениe',
            primary_table: 'Основная таблица',
            primary_field: 'Основное поле',
            referenced_table: 'Ссылается на таблицу',
            referenced_field: 'Ссылается на поле',
            primary_table_placeholder: 'Выберите таблицу',
            primary_field_placeholder: 'Выберите поле',
            referenced_table_placeholder: 'Выберите таблицу',
            referenced_field_placeholder: 'Выберите поле',
            no_tables_found: 'Таблицы не найдены',
            no_fields_found: 'Поля не найдены',
            create: 'Создать',
            cancel: 'Отменить',
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
            description: 'Выберите детализацию изображения при экспорте:',
            scale_1x: '1x Обычный',
            scale_2x: '2x (Рекомендовано)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Отменить',
            export: 'Экспортировать',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'Выбрать схему',
            description:
                'В настоящее время отображается несколько схем. Выберите одну для новой таблицы.',
            cancel: 'Отменить',
            confirm: 'Подтвердить',
        },

        update_table_schema_dialog: {
            title: 'Изменить схему',
            description: 'Обновить таблицу "{{tableName}}" схема',
            cancel: 'Отменить',
            confirm: 'Изменить',
        },

        create_table_schema_dialog: {
            title: 'Создать новую схему',
            description:
                'Схемы еще не существуют. Создайте вашу первую схему, чтобы организовать таблицы.',
            create: 'Создать',
            cancel: 'Отменить',
        },

        star_us_dialog: {
            title: 'Помогите нам стать лучше!',
            description:
                'Хотите отметить нас на GitHub? Это всего лишь один клик!',
            close: 'Не сейчас',
            confirm: 'Конечно!',
        },
        export_diagram_dialog: {
            title: 'Экспорт кода диаграммы',
            description: 'Выберите формат экспорта:',
            format_json: 'JSON',
            cancel: 'Отменить',
            export: 'Экспортировать',
            error: {
                title: 'Ошибка экспортирования диаграммы',
                description:
                    'Что-то пошло не так. Если вам нужна помощь, напишите нам: support@chartdb.io',
            },
        },
        import_diagram_dialog: {
            title: 'Импорт кода диаграммы',
            description: 'Вставьте JSON код диаграммы ниже:',
            cancel: 'Отменить',
            import: 'Импортировать',
            error: {
                title: 'Ошибка при импорте диаграммы',
                description:
                    'Код JSON диаграммы некорректен. Проверьте, пожалуйста, код и попробуйте снова. Проблема не решается? Напишите нам: support@chartdb.io',
            },
        },
        import_dbml_dialog: {
            example_title: 'Импорт DBML',
            title: 'Импортировать DBML',
            description: 'Импортировать схему базы данных из DBML формата.',
            import: 'Импортировать',
            cancel: 'Отмена',
            skip_and_empty: 'Продолжить с пустой диаграммой',
            show_example: 'Использовать эту схему',

            error: {
                title: 'Ошибка',
                description:
                    'Ошибка парсинга DBML. Пожалуйста проверьте синтаксис.',
            },
        },
        relationship_type: {
            one_to_one: 'Один к одному',
            one_to_many: 'Один ко многим',
            many_to_one: 'Многие к одному',
            many_to_many: 'Многие ко многим',
        },

        canvas_context_menu: {
            new_table: 'Создать таблицу',
            new_view: 'Новое представление',
            new_relationship: 'Создать отношение',
            new_area: 'Новая область',
            new_note: 'Новая Заметка',
        },

        table_node_context_menu: {
            edit_table: 'Изменить таблицу',
            duplicate_table: 'Создать копию',
            delete_table: 'Удалить таблицу',
            add_relationship: 'Добавить связь',
        },

        copy_to_clipboard: 'Скопировать в буфер обмена',
        copied: 'Скопировано!',
        snap_to_grid_tooltip: 'Выравнивание по сетке (Удерживайте {{key}})',
        tool_tips: {
            double_click_to_edit: 'Кликните дважды, чтобы изменить',
        },

        language_select: {
            change_language: 'Сменить язык',
        },

        on: 'Вкл',
        off: 'Выкл',
    },
};

export const ruMetadata: LanguageMetadata = {
    name: 'Russian',
    nativeName: 'Русский',
    code: 'ru',
};
