import { LanguageTranslation } from '../types';

export const es: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Archivo',
                new: 'Nuevo',
                open: 'Abrir',
                save: 'Guardar',
                export_sql: 'Exportar SQL',
                export_as: 'Exportar como',
                delete_diagram: 'Eliminar Diagrama',
                exit: 'Salir',
            },
            edit: {
                edit: 'Editar',
                undo: 'Deshacer',
                redo: 'Rehacer',
                clear: 'Limpiar',
            },
            view: {
                view: 'Ver',
                show_sidebar: 'Mostrar Barra Lateral',
                hide_sidebar: 'Ocultar Barra Lateral',
                zoom_on_scroll: 'Zoom al Desplazarse',
                theme: 'Tema',
                change_language: 'Idioma',
            },
            help: {
                help: 'Ayuda',
                visit_website: 'Visitar ChartDB',
                join_discord: 'Únete a nosotros en Discord',
            },
        },

        delete_diagram_alert: {
            title: 'Eliminar Diagrama',
            description:
                'Esta acción no se puede deshacer. Esto eliminará permanentemente el diagrama.',
            cancel: 'Cancelar',
            delete: 'Eliminar',
        },

        clear_diagram_alert: {
            title: 'Limpiar Diagrama',
            description:
                'Esta acción no se puede deshacer. Esto eliminará permanentemente todos los datos en el diagrama.',
            cancel: 'Cancelar',
            clear: 'Limpiar',
        },

        theme: {
            system: 'Sistema',
            light: 'Claro',
            dark: 'Oscuro',
        },

        zoom: {
            on: 'Encendido',
            off: 'Apagado',
        },

        last_saved: 'Último guardado',
        saved: 'Guardado',
        diagrams: 'Diagramas',
        loading_diagram: 'Cargando diagrama...',

        side_panel: {
            view_all_options: 'Ver todas las opciones...',
            tables_section: {
                tables: 'Tablas',
                add_table: 'Agregar Tabla',
                filter: 'Filtrar',
                collapse: 'Colapsar Todo',

                table: {
                    fields: 'Campos',
                    nullable: '¿Opcional?',
                    primary_key: 'Clave Primaria',
                    indexes: 'Índices',
                    comments: 'Comentarios',
                    no_comments: 'Sin comentarios',
                    add_field: 'Agregar Campo',
                    add_index: 'Agregar Índice',
                    index_select_fields: 'Seleccionar campos',
                    field_name: 'Nombre',
                    field_type: 'Tipo',
                    field_actions: {
                        title: 'Atributos del Campo',
                        unique: 'Único',
                        comments: 'Comentarios',
                        no_comments: 'Sin comentarios',
                        delete_field: 'Eliminar Campo',
                    },
                    index_actions: {
                        title: 'Atributos del Índice',
                        name: 'Nombre',
                        unique: 'Único',
                        delete_index: 'Eliminar Índice',
                    },
                    table_actions: {
                        title: 'Acciones de la Tabla',
                        add_field: 'Agregar Campo',
                        add_index: 'Agregar Índice',
                        delete_table: 'Eliminar Tabla',
                    },
                },
                empty_state: {
                    title: 'No hay tablas',
                    description: 'Crea una tabla para comenzar',
                },
            },
            relationships_section: {
                relationships: 'Relaciones',
                filter: 'Filtrar',
                collapse: 'Colapsar Todo',
                relationship: {
                    primary: 'Primaria',
                    foreign: 'Foránea',
                    cardinality: 'Cardinalidad',
                    delete_relationship: 'Eliminar',
                    relationship_actions: {
                        title: 'Acciones',
                        delete_relationship: 'Eliminar',
                    },
                },
                empty_state: {
                    title: 'No hay relaciones',
                    description: 'Crea una relación para conectar tablas',
                },
            },
        },

        toolbar: {
            zoom_in: 'Acercar',
            zoom_out: 'Alejar',
            save: 'Guardar',
            show_all: 'Mostrar Todo',
            undo: 'Deshacer',
            redo: 'Rehacer',
        },

        new_diagram_dialog: {
            database_selection: {
                title: '¿Cuál es tu Base de Datos?',
                description:
                    'Cada base de datos tiene sus propias características y capacidades únicas.',
                check_examples_long: 'Ver Ejemplos',
                check_examples_short: 'Ejemplos',
            },

            import_database: {
                title: 'Importa tu Base de Datos',
                database_edition: 'Edición de Base de Datos:',
                step_1: 'Ejecuta este script en tu base de datos:',
                step_2: 'Pega el resultado del script aquí:',
                script_results_placeholder: 'Resultados del script aquí...',
                ssms_instructions: {
                    button_text: 'Instrucciones SSMS',
                    title: 'Instrucciones',
                    step_1: 'Ve a Herramientas > Opciones > Resultados de Consulta > SQL Server.',
                    step_2: 'Si estás usando "Resultados en Cuadrícula", cambia el Máximo de Caracteres Recuperados para Datos No XML (configúralo en 9999999).',
                },
            },

            cancel: 'Cancelar',
            back: 'Atrás',
            empty_diagram: 'Diagrama vacío',
            continue: 'Continuar',
            import: 'Importar',
        },

        open_diagram_dialog: {
            title: 'Abrir Diagrama',
            description:
                'Selecciona un diagrama para abrir de la lista a continuación.',
            table_columns: {
                name: 'Nombre',
                created_at: 'Creado en',
                last_modified: 'Última modificación',
                tables_count: 'Tablas',
            },
            cancel: 'Cancelar',
            open: 'Abrir',
        },

        export_sql_dialog: {
            title: 'Exportar SQL',
            description:
                'Exporta el esquema de tu diagrama a un script {{databaseType}}',
            close: 'Cerrar',
            loading: {
                text: 'La IA está generando SQL para {{databaseType}}...',
                description: 'Esto debería tomar hasta 30 segundos.',
            },
            error: {
                message:
                    'Error al generar el script SQL. Por favor, intenta nuevamente más tarde o <0>contáctanos</0>.',
                description:
                    'Siéntete libre de usar tu OPENAI_TOKEN, consulta el manual <0>aquí</0>.',
            },
        },

        relationship_type: {
            one_to_one: 'Uno a Uno',
            one_to_many: 'Uno a Muchos',
            many_to_one: 'Muchos a Uno',
        },
    },
};

export const esMetadata = {
    name: 'Español',
    code: 'es',
};
