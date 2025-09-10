import type { LanguageMetadata, LanguageTranslation } from '../types';

export const es: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Nuevo',
            browse: 'Examinar',
            tables: 'Tablas',
            refs: 'Refs',
            areas: 'Áreas',
            dependencies: 'Dependencias',
            custom_types: 'Tipos Personalizados',
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
                show_minimap: 'Mostrar minimapa',
                hide_minimap: 'Ocultar minimapa',
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
        copy_to_clipboard: 'Copiar en el portapapeles',
        copied: '¡Copiado!',
        share_table_dialog: {
            title: 'Compartir tabla',
            description: 'Copia el siguiente enlace para compartir esta tabla.',
            close: 'Cerrar',
        },
        side_panel: {
            view_all_options: 'Ver todas las opciones...',
            tables_section: {
                tables: 'Tablas',
                add_table: 'Agregar Tabla',
                add_view: 'Agregar Vista',
                filter: 'Filtrar',
                collapse: 'Colapsar Todo',
                clear: 'Limpiar filtro',
                no_results:
                    'No se han encontrado tablas que coincidan con tu filtro.',
                show_list: 'Mostrar lista de tablas',
                show_dbml: 'Mostrar editor DBML',
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
                        default_value: 'Valor por defecto',
                        no_default: 'Ningún valor predeterminado',
                        character_length: 'Longitud máxima',
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
                        duplicate_table: 'Duplicar Tabla',
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
            areas_section: {
                areas: 'Áreas',
                add_area: 'Agregar Área',
                filter: 'Filtrar',
                clear: 'Limpiar filtro',
                no_results:
                    'No se han encontrado áreas que coincidan con tu filtro.',
                area: {
                    area_actions: {
                        title: 'Acciones de área',
                        edit_name: 'Editar nombre',
                        delete_area: 'Eliminar área',
                    },
                },
                empty_state: {
                    title: 'No hay áreas',
                    description: 'Crea un área para empezar',
                },
            },
            custom_types_section: {
                custom_types: 'Tipos personalizados',
                filter: 'Filtrar',
                clear: 'Limpiar filtro',
                no_results:
                    'No se han encontrado tipos personalizados que coincidan con tu filtro.',
                empty_state: {
                    title: 'No hay tipos personalizados',
                    description:
                        'Los tipos personalizados aparecerán aquí cuando estén disponibles en su base de datos',
                },
                custom_type: {
                    kind: 'Tipo',
                    enum_values: 'Valores Enum',
                    composite_fields: 'Campos',
                    no_fields: 'Campo no definido.',
                    no_values: 'No hay valores de enum definidos',
                    field_name_placeholder: 'Nombre del campo',
                    field_type_placeholder: 'Seleccionar tipo',
                    add_field: 'Añadir Campo',
                    no_fields_tooltip:
                        'No hay campos definidos para este tipo personalizado',
                    custom_type_actions: {
                        title: 'Acciones',
                        highlight_fields: 'Resaltar campos',
                        delete_custom_type: 'Eliminar',
                        clear_field_highlight: 'Borrar resaltado',
                    },
                    delete_custom_type: 'Eliminar tipo',
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
                'Resaltado "{{typeName}}" - Haga clic para borrar',
            highlight_overlapping_tables: 'Resaltar tablas superpuestas',
            filter: 'Filtrar tablas',
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
            import_from_file: 'Importar desde Archivo',
            empty_diagram: 'Diagrama vacío',
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
            start_new: 'Empezar con un nuevo diagrama',
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
            advanced_options: 'Opciones avanzadas',
            pattern: 'Incluir patrón de fondo',
            pattern_description:
                'Añade un patrón de cuadrícula sutil al fondo.',
            transparent: 'Fondo transparente',
            transparent_description: 'Elimina el color de fondo de la imagen.',
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
        export_diagram_dialog: {
            title: 'Exportar diagrama',
            description: 'Elija el formato para la exportación:',
            format_json: 'JSON',
            cancel: 'Cancelar',
            export: 'Exportar',
            error: {
                title: 'Error al exportar el diagrama',
                description:
                    'Se ha producido un error. ¿Necesitas ayuda? support@chartdb.io',
            },
        },
        import_diagram_dialog: {
            title: 'Importar diagrama',
            description: 'Pega el JSON del diagrama a continuación:',
            cancel: 'Cancelar',
            import: 'Importar',
            error: {
                title: 'Error al importar el diagrama',
                description:
                    'El JSON del diagrama no es válido. Compruebe el JSON e inténtelo de nuevo. ¿Necesitas ayuda? support@chartdb.io',
            },
        },
        import_dbml_dialog: {
            example_title: 'Importar Ejemplo DBML',
            title: 'Importar DBML',
            description:
                'Importar un esquema de base de datos desde el formato DBML.',
            import: 'Importar',
            cancel: 'Cancelar',
            skip_and_empty: 'Saltar y vaciar',
            show_example: 'Mostrar ejemplo',
            error: {
                title: 'Error',
                description: 'Error al analizar DBML. Comprueba la sintaxis.',
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
            new_area: 'Nueva Área',
        },
        table_node_context_menu: {
            edit_table: 'Editar Tabla',
            duplicate_table: 'Duplicar Tabla',
            delete_table: 'Eliminar Tabla',
            add_relationship: 'Agregar Relación',
        },
        snap_to_grid_tooltip: 'Ajustar a la cuadrícula (mantener {{key}})',
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
