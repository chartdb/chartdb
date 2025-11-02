import type { LanguageMetadata, LanguageTranslation } from '../types';

export const es: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Nuevo',
            browse: 'Examinar',
            tables: 'Tablas',
            refs: 'Refs',
            dependencies: 'Dependencias',
            custom_types: 'Tipos Personalizados',
            visuals: 'Visuales',
        },
        menu: {
            actions: {
                actions: 'Acciones',
                new: 'Nuevo...',
                browse: 'Examinar...',
                save: 'Guardar',
                import: 'Importar Base de Datos',
                export_sql: 'Exportar SQL',
                export_as: 'Exportar como',
                delete_diagram: 'Eliminar',
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
                show_field_attributes: 'Mostrar Atributos de Campo',
                hide_field_attributes: 'Ocultar Atributos de Campo',
                show_sidebar: 'Mostrar Barra Lateral',
                hide_sidebar: 'Ocultar Barra Lateral',
                zoom_on_scroll: 'Zoom al Desplazarse',
                show_views: 'Vistas de Base de Datos',
                theme: 'Tema',
                show_dependencies: 'Mostrar dependencias',
                hide_dependencies: 'Ocultar dependencias',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: 'Respaldo',
                export_diagram: 'Exportar Diagrama',
                restore_diagram: 'Restaurar Diagrama',
            },
            help: {
                help: 'Ayuda',
                docs_website: 'Documentación',
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

        reorder_diagram_alert: {
            title: 'Organizar Diagrama Automáticamente',
            description:
                'Esta acción reorganizará todas las tablas en el diagrama. ¿Deseas continuar?',
            reorder: 'Organizar Automáticamente',
            cancel: 'Cancelar',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Copia fallida',
                description: 'Portapapeles no soportado',
            },
            failed: {
                title: 'Copia fallida',
                description: 'Algo salió mal. Por favor, inténtelo de nuevo.',
            },
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
        loading_diagram: 'Cargando diagrama...',
        deselect_all: 'Deseleccionar todo',
        select_all: 'Seleccionar todo',
        clear: 'Limpiar',
        show_more: 'Mostrar más',
        show_less: 'Mostrar menos',
        copy_to_clipboard: 'Copy to Clipboard',
        copied: 'Copied!',

        side_panel: {
            view_all_options: 'Ver todas las opciones...',
            tables_section: {
                tables: 'Tablas',
                add_table: 'Agregar Tabla',
                add_view: 'Agregar Vista',
                filter: 'Filtrar',
                collapse: 'Colapsar Todo',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

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
                    no_types_found: 'No se encontraron tipos',
                    field_actions: {
                        title: 'Atributos del Campo',
                        unique: 'Único',
                        auto_increment: 'Autoincremento',
                        comments: 'Comentarios',
                        no_comments: 'Sin comentarios',
                        delete_field: 'Eliminar Campo',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'Precisión',
                        scale: 'Escala',
                    },
                    index_actions: {
                        title: 'Atributos del Índice',
                        name: 'Nombre',
                        unique: 'Único',
                        index_type: 'Tipo de Índice',
                        delete_index: 'Eliminar Índice',
                    },
                    table_actions: {
                        title: 'Acciones de la Tabla',
                        change_schema: 'Cambiar Esquema',
                        add_field: 'Agregar Campo',
                        add_index: 'Agregar Índice',
                        duplicate_table: 'Duplicate Table', // TODO: Translate
                        delete_table: 'Eliminar Tabla',
                    },
                },
                empty_state: {
                    title: 'No hay tablas',
                    description: 'Crea una tabla para comenzar',
                },
            },
            refs_section: {
                refs: 'Refs',
                filter: 'Filtrar',
                collapse: 'Colapsar Todo',
                add_relationship: 'Agregar Relación',
                relationships: 'Relaciones',
                dependencies: 'Dependencias',
                relationship: {
                    relationship: 'Relación',
                    primary: 'Tabla Primaria',
                    foreign: 'Tabla Referenciada',
                    cardinality: 'Cardinalidad',
                    delete_relationship: 'Eliminar',
                    relationship_actions: {
                        title: 'Acciones',
                        delete_relationship: 'Eliminar',
                    },
                },
                dependency: {
                    dependency: 'Dependencia',
                    table: 'Tabla',
                    dependent_table: 'Vista Dependiente',
                    delete_dependency: 'Eliminar',
                    dependency_actions: {
                        title: 'Acciones',
                        delete_dependency: 'Eliminar',
                    },
                },
                empty_state: {
                    title: 'Sin relaciones',
                    description: 'Crea una relación para comenzar',
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
                visuals: 'Visuales',
                tabs: {
                    areas: 'Areas',
                    notes: 'Notas',
                },
            },

            notes_section: {
                filter: 'Filtrar',
                add_note: 'Agregar Nota',
                no_results: 'No se encontraron notas',
                clear: 'Limpiar Filtro',
                empty_state: {
                    title: 'Sin Notas',
                    description:
                        'Crea una nota para agregar anotaciones de texto en el lienzo',
                },
                note: {
                    empty_note: 'Nota vacía',
                    note_actions: {
                        title: 'Acciones de Nota',
                        edit_content: 'Editar Contenido',
                        delete_note: 'Eliminar Nota',
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
                    no_values: 'No hay valores de enum definidos',
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
            zoom_in: 'Acercar',
            zoom_out: 'Alejar',
            save: 'Guardar',
            show_all: 'Mostrar Todo',
            undo: 'Deshacer',
            redo: 'Rehacer',
            reorder_diagram: 'Organizar Diagrama Automáticamente',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'Resaltar tablas superpuestas',
            // TODO: Translate
            filter: 'Filter Tables',
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
                step_2: 'Pega el resultado del script aquí →',
                script_results_placeholder: 'Resultados del script aquí...',
                ssms_instructions: {
                    button_text: 'Instrucciones SSMS',
                    title: 'Instrucciones',
                    step_1: 'Ve a Herramientas > Opciones > Resultados de Consulta > SQL Server.',
                    step_2: 'Si estás usando "Resultados en Cuadrícula", cambia el Máximo de Caracteres Recuperados para Datos No XML (configúralo en 9999999).',
                },
                instructions_link: '¿Necesitas ayuda? mira cómo',
                check_script_result: 'Revisa el resultado del script',
            },

            cancel: 'Cancelar',
            back: 'Atrás',
            // TODO: Translate
            import_from_file: 'Import from File',
            empty_diagram: 'Base de datos vacía',
            continue: 'Continuar',
            import: 'Importar',
        },

        open_diagram_dialog: {
            title: 'Abrir Base de Datos',
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

            diagram_actions: {
                open: 'Abrir',
                duplicate: 'Duplicar',
                delete: 'Eliminar',
            },
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

        export_image_dialog: {
            title: 'Exportar imagen',
            description: 'Escoge el factor de escalamiento para exportar:',
            scale_1x: '1x regular',
            scale_2x: '2x (recomendado)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Cancelar',
            export: 'Exportar',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
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
        create_table_schema_dialog: {
            title: 'Crear Nuevo Esquema',
            description:
                'Aún no existen esquemas. Crea tu primer esquema para organizar tus tablas.',
            create: 'Crear',
            cancel: 'Cancelar',
        },

        star_us_dialog: {
            title: '¡Ayúdanos a mejorar!',
            description:
                '¿Te gusta ChartDB? Por favor, danos una estrella en GitHub.',
            close: 'Ahora no',
            confirm: '¡Claro!',
        },

        // TODO: Translate
        export_diagram_dialog: {
            title: 'Export Diagram',
            description: 'Choose the format for export:',
            format_json: 'JSON',
            cancel: 'Cancel',
            export: 'Export',
            error: {
                title: 'Error exporting diagram',
                description:
                    'Something went wrong. Need help? support@chartdb.io',
            },
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
                    'The diagram JSON is invalid. Please check the JSON and try again. Need help? support@chartdb.io',
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
            one_to_one: 'Uno a Uno',
            one_to_many: 'Uno a Muchos',
            many_to_one: 'Muchos a Uno',
            many_to_many: 'Muchos a Muchos',
        },

        canvas_context_menu: {
            new_table: 'Nueva Tabla',
            new_view: 'Nueva Vista',
            new_relationship: 'Nueva Relación',
            // TODO: Translate
            new_area: 'New Area',
            new_note: 'Nueva Nota',
        },

        table_node_context_menu: {
            edit_table: 'Editar Tabla',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: 'Eliminar Tabla',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'Doble clic para editar',
        },

        language_select: {
            change_language: 'Idioma',
        },

        on: 'Encendido',
        off: 'Apagado',
    },
};

export const esMetadata: LanguageMetadata = {
    name: 'Spanish',
    nativeName: 'Español',
    code: 'es',
};
