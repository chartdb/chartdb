import type { LanguageMetadata, LanguageTranslation } from '../types';

export const es: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Archivo',
                new: 'Nuevo',
                open: 'Abrir',
                save: 'Guardar',
                import_database: 'Importar Base de Datos',
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
                hide_cardinality: 'Ocultar Cardinalidad',
                show_cardinality: 'Mostrar Cardinalidad',
                show_sidebar: 'Mostrar Barra Lateral',
                hide_sidebar: 'Ocultar Barra Lateral',
                zoom_on_scroll: 'Zoom al Desplazarse',
                theme: 'Tema',
                change_language: 'Idioma',
                // TODO: Translate
                show_dependencies: 'Show Dependencies',
                hide_dependencies: 'Hide Dependencies',
            },
            help: {
                help: 'Ayuda',
                visit_website: 'Visitar ChartDB',
                join_discord: 'Únete a nosotros en Discord',
                schedule_a_call: '¡Habla con nosotros!',
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

        reorder_diagram_alert: {
            title: 'Reordenar Diagrama',
            description:
                'Esta acción reorganizará todas las tablas en el diagrama. ¿Deseas continuar?',
            reorder: 'Reordenar',
            cancel: 'Cancelar',
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
        deselect_all: 'Deselect All', // TODO: Translate
        select_all: 'Select All', // TODO: Translate
        clear: 'Clear', // TODO: Translate
        show_more: 'Show More', // TODO: Translate
        show_less: 'Show Less', // TODO: Translate

        side_panel: {
            schema: 'Schema:', // TODO: Translate
            filter_by_schema: 'Filter by schema', // TODO: Translate
            search_schema: 'Search schema...', // TODO: Translate
            no_schemas_found: 'No schemas found.', // TODO: Translate
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
                    no_types_found: 'No types found', // TODO: Translate
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
                        change_schema: 'Cambiar Esquema',
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
                add_relationship: 'Agregar Relación',
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
            // TODO: Translate
            dependencies_section: {
                dependencies: 'Dependencies',
                filter: 'Filter',
                collapse: 'Collapse All',
                dependency: {
                    table: 'Table',
                    dependent_table: 'Dependent View',
                    delete_dependency: 'Delete',
                    dependency_actions: {
                        title: 'Actions',
                        delete_dependency: 'Delete',
                    },
                },
                empty_state: {
                    title: 'No dependencies',
                    description: 'Create a view to get started',
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
            reorder_diagram: 'Reordenar Diagrama',
            // TODO: Translate
            highlight_overlapping_tables: 'Highlight Overlapping Tables',
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
                // TODO: Translate
                instructions_link: 'Need help? Watch how',
            },

            cancel: 'Cancelar',
            back: 'Atrás',
            empty_diagram: 'Diagrama vacío',
            continue: 'Continuar',
            import: 'Importar',
        },

        open_diagram_dialog: {
            // TODO: Translate
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

        create_relationship_dialog: {
            cancel: 'Cancelar',
            create: 'Crear',
            no_fields_found: 'No se encontraron campos',
            no_tables_found: 'No se encontraron tablas',
            primary_field: 'Campo Primario',
            primary_table: 'Tabla Primaria',
            primary_table_placeholder: 'Seleccionar tabla',
            primary_field_placeholder: 'Seleccionar campo',
            referenced_field: 'Campo Referenciado',
            referenced_field_placeholder: 'Seleccionar campo',
            referenced_table: 'Tabla Referenciada',
            referenced_table_placeholder: 'Seleccionar tabla',
            title: 'Crear Relación',
        },

        import_database_dialog: {
            title: 'Importar a Diagrama Actual',
            override_alert: {
                title: 'Importar Base de Datos',
                content: {
                    alert: 'Importar este diagrama afectará las tablas y relaciones existentes.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> nuevas tablas se agregarán.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> nuevas relaciones se crearán.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> tablas se sobrescribirán.',
                    proceed: '¿Deseas continuar?',
                },
                import: 'Importar',
                cancel: 'Cancelar',
            },
        },

        // TODO: Translate
        export_image_dialog: {
            title: 'Export Image',
            description: 'Choose the scale factor for export:',
            scale_1x: '1x Regular',
            scale_2x: '2x (Recommended)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Cancel',
            export: 'Export',
        },

        new_table_schema_dialog: {
            title: 'Seleccionar Esquema',
            description:
                'Actualmente se muestran múltiples esquemas. Selecciona uno para la nueva tabla.',
            cancel: 'Cancelar',
            confirm: 'Confirmar',
        },

        update_table_schema_dialog: {
            title: 'Cambiar Esquema',
            description: 'Actualizar esquema de la tabla "{{tableName}}"',
            cancel: 'Cancelar',
            confirm: 'Cambiar',
        },

        star_us_dialog: {
            title: '¡Ayúdanos a mejorar!',
            description:
                '¿Te gusta ChartDB? Por favor, danos una estrella en GitHub.',
            close: 'Ahora no',
            confirm: '¡Claro!',
        },

        multiple_schemas_alert: {
            title: 'Múltiples Esquemas',
            description:
                '{{schemasCount}} esquemas en este diagrama. Actualmente mostrando: {{formattedSchemas}}.',
            dont_show_again: 'No mostrar de nuevo',
            change_schema: 'Cambiar',
            none: 'nada',
        },

        relationship_type: {
            one_to_one: 'Uno a Uno',
            one_to_many: 'Uno a Muchos',
            many_to_one: 'Muchos a Uno',
            many_to_many: 'Muchos a Muchos',
        },

        canvas_context_menu: {
            new_table: 'Nueva Tabla',
            new_relationship: 'Nueva Relación',
        },

        table_node_context_menu: {
            edit_table: 'Editar Tabla',
            delete_table: 'Eliminar Tabla',
        },
    },
};

export const esMetadata: LanguageMetadata = {
    name: 'Español',
    code: 'es',
};
