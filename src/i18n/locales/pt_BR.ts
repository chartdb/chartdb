import type { LanguageMetadata, LanguageTranslation } from '../types';

export const pt_BR: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Novo',
            browse: 'Navegar',
            tables: 'Tabelas',
            refs: 'Refs',
            dependencies: 'Dependências',
            custom_types: 'Tipos Personalizados',
            visuals: 'Visuais',
        },
        menu: {
            actions: {
                actions: 'Ações',
                new: 'Novo...',
                browse: 'Navegar...',
                save: 'Salvar',
                import: 'Importar Banco de Dados',
                export_sql: 'Exportar SQL',
                export_as: 'Exportar como',
                delete_diagram: 'Excluir',
            },
            edit: {
                edit: 'Editar',
                undo: 'Desfazer',
                redo: 'Refazer',
                clear: 'Limpar',
            },
            view: {
                view: 'Visualizar',
                show_sidebar: 'Mostrar Barra Lateral',
                hide_sidebar: 'Ocultar Barra Lateral',
                hide_cardinality: 'Ocultar Cardinalidade',
                show_cardinality: 'Mostrar Cardinalidade',
                hide_field_attributes: 'Ocultar Atributos de Campo',
                show_field_attributes: 'Mostrar Atributos de Campo',
                zoom_on_scroll: 'Zoom ao Rolar',
                show_views: 'Visualizações do Banco de Dados',
                theme: 'Tema',
                show_dependencies: 'Mostrar Dependências',
                hide_dependencies: 'Ocultar Dependências',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            // TODO: Translate
            backup: {
                backup: 'Backup',
                export_diagram: 'Exportar Diagrama',
                restore_diagram: 'Restaurar Diagrama',
            },
            help: {
                help: 'Ajuda',
                docs_website: 'Documentação',
                join_discord: 'Junte-se a nós no Discord',
            },
        },

        delete_diagram_alert: {
            title: 'Excluir Diagrama',
            description:
                'Esta ação não pode ser desfeita. Isso excluirá permanentemente o diagrama.',
            cancel: 'Cancelar',
            delete: 'Excluir',
        },

        clear_diagram_alert: {
            title: 'Limpar Diagrama',
            description:
                'Esta ação não pode ser desfeita. Isso excluirá permanentemente todos os dados do diagrama.',
            cancel: 'Cancelar',
            clear: 'Limpar',
        },

        reorder_diagram_alert: {
            title: 'Organizar Diagrama Automaticamente',
            description:
                'Esta ação reorganizará todas as tabelas no diagrama. Deseja continuar?',
            reorder: 'Organizar Automaticamente',
            cancel: 'Cancelar',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Falha na cópia',
                description: 'Área de transferência não suportada',
            },
            failed: {
                title: 'Falha na cópia',
                description: 'Algo deu errado. Por favor, tente novamente.',
            },
        },

        theme: {
            system: 'Sistema',
            light: 'Claro',
            dark: 'Escuro',
        },

        zoom: {
            on: 'Ativado',
            off: 'Desativado',
        },

        last_saved: 'Última vez salvo',
        saved: 'Salvo',
        loading_diagram: 'Carregando diagrama...',
        deselect_all: 'Desmarcar Todos',
        select_all: 'Selecionar Todos',
        clear: 'Limpar',
        show_more: 'Mostrar Mais',
        show_less: 'Mostrar Menos',
        copy_to_clipboard: 'Copiar para a Área de Transferência',
        copied: 'Copiado!',

        side_panel: {
            view_all_options: 'Ver todas as Opções...',
            tables_section: {
                tables: 'Tabelas',
                add_table: 'Adicionar Tabela',
                add_view: 'Adicionar Visualização',
                filter: 'Filtrar',
                collapse: 'Colapsar Todas',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'Campos',
                    nullable: 'Permite Nulo?',
                    primary_key: 'Chave Primária',
                    indexes: 'Índices',
                    comments: 'Comentários',
                    no_comments: 'Sem comentários',
                    add_field: 'Adicionar Campo',
                    add_index: 'Adicionar Índice',
                    index_select_fields: 'Selecionar campos',
                    no_types_found: 'Nenhum tipo encontrado',
                    field_name: 'Nome',
                    field_type: 'Tipo',
                    field_actions: {
                        title: 'Atributos do Campo',
                        unique: 'Único',
                        auto_increment: 'Incremento Automático',
                        comments: 'Comentários',
                        no_comments: 'Sem comentários',
                        delete_field: 'Excluir Campo',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'Precisão',
                        scale: 'Escala',
                    },
                    index_actions: {
                        title: 'Atributos do Índice',
                        name: 'Nome',
                        unique: 'Único',
                        index_type: 'Tipo de Índice',
                        delete_index: 'Excluir Índice',
                    },
                    table_actions: {
                        title: 'Ações da Tabela',
                        change_schema: 'Alterar Esquema',
                        add_field: 'Adicionar Campo',
                        add_index: 'Adicionar Índice',
                        duplicate_table: 'Duplicate Table', // TODO: Translate
                        delete_table: 'Excluir Tabela',
                    },
                },
                empty_state: {
                    title: 'Sem tabelas',
                    description: 'Crie uma tabela para começar',
                },
            },
            refs_section: {
                refs: 'Refs',
                filter: 'Filtrar',
                collapse: 'Colapsar Todas',
                add_relationship: 'Adicionar Relacionamento',
                relationships: 'Relacionamentos',
                dependencies: 'Dependências',
                relationship: {
                    relationship: 'Relacionamento',
                    primary: 'Tabela Primária',
                    foreign: 'Tabela Referenciada',
                    cardinality: 'Cardinalidade',
                    delete_relationship: 'Excluir',
                    relationship_actions: {
                        title: 'Ações',
                        delete_relationship: 'Excluir',
                    },
                },
                dependency: {
                    dependency: 'Dependência',
                    table: 'Tabela',
                    dependent_table: 'Visualização Dependente',
                    delete_dependency: 'Excluir',
                    dependency_actions: {
                        title: 'Ações',
                        delete_dependency: 'Excluir',
                    },
                },
                empty_state: {
                    title: 'Sem relacionamentos',
                    description: 'Crie um relacionamento para começar',
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
                visuals: 'Visuais',
                tabs: {
                    areas: 'Areas',
                    notes: 'Notas',
                },
            },

            notes_section: {
                filter: 'Filtrar',
                add_note: 'Adicionar Nota',
                no_results: 'Nenhuma nota encontrada',
                clear: 'Limpar Filtro',
                empty_state: {
                    title: 'Sem Notas',
                    description:
                        'Crie uma nota para adicionar anotações de texto na tela',
                },
                note: {
                    empty_note: 'Nota vazia',
                    note_actions: {
                        title: 'Ações de Nota',
                        edit_content: 'Editar Conteúdo',
                        delete_note: 'Excluir Nota',
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
                    no_values: 'Nenhum valor de enum definido',
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
            zoom_in: 'Aumentar Zoom',
            zoom_out: 'Diminuir Zoom',
            save: 'Salvar',
            show_all: 'Mostrar Tudo',
            undo: 'Desfazer',
            redo: 'Refazer',
            reorder_diagram: 'Organizar Diagrama Automaticamente',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'Destacar Tabelas Sobrepostas',
            // TODO: Translate
            filter: 'Filter Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Qual é o seu Banco de Dados?',
                description:
                    'Cada banco de dados possui recursos e capacidades únicas.',
                check_examples_long: 'Ver Exemplos',
                check_examples_short: 'Exemplos',
            },

            import_database: {
                title: 'Importe seu Banco de Dados',
                database_edition: 'Edição do Banco de Dados:',
                step_1: 'Execute este script no seu banco de dados:',
                step_2: 'Cole o resultado do script aqui →',
                script_results_placeholder: 'Resultados do script aqui...',
                ssms_instructions: {
                    button_text: 'Instruções do SSMS',
                    title: 'Instruções',
                    step_1: 'Vá para Ferramentas > Opções > Resultados da Consulta > SQL Server.',
                    step_2: 'Se estiver usando "Resultados para Grade," altere o Máximo de Caracteres para Dados Não-XML (definido para 9999999).',
                },
                instructions_link: 'Precisa de ajuda? Veja como',
                check_script_result: 'Verificar Resultado do Script',
            },

            cancel: 'Cancelar',
            back: 'Voltar',
            // TODO: Translate
            import_from_file: 'Import from File',
            empty_diagram: 'Banco de dados vazio',
            continue: 'Continuar',
            import: 'Importar',
        },

        open_diagram_dialog: {
            title: 'Abrir Banco de Dados',
            description: 'Selecione um diagrama para abrir da lista abaixo.',
            table_columns: {
                name: 'Nome',
                created_at: 'Criado em',
                last_modified: 'Última Modificação',
                tables_count: 'Tabelas',
            },
            cancel: 'Cancelar',
            open: 'Abrir',

            diagram_actions: {
                open: 'Abrir',
                duplicate: 'Duplicar',
                delete: 'Excluir',
            },
        },

        export_sql_dialog: {
            title: 'Exportar SQL',
            description:
                'Exporte o esquema do seu diagrama para o script {{databaseType}}',
            close: 'Fechar',
            loading: {
                text: 'A IA está gerando SQL para {{databaseType}}...',
                description: 'Isso pode levar até 30 segundos.',
            },
            error: {
                message:
                    'Erro ao gerar o script SQL. Tente novamente mais tarde ou <0>entre em contato conosco</0>.',
                description:
                    'Sinta-se à vontade para usar seu OPENAI_TOKEN, veja o manual <0>aqui</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Criar Relacionamento',
            primary_table: 'Tabela Primária',
            primary_field: 'Campo Primário',
            referenced_table: 'Tabela Referenciada',
            referenced_field: 'Campo Referenciado',
            primary_table_placeholder: 'Selecionar tabela',
            primary_field_placeholder: 'Selecionar campo',
            referenced_table_placeholder: 'Selecionar tabela',
            referenced_field_placeholder: 'Selecionar campo',
            no_tables_found: 'Nenhuma tabela encontrada',
            no_fields_found: 'Nenhum campo encontrado',
            create: 'Criar',
            cancel: 'Cancelar',
        },

        import_database_dialog: {
            title: 'Importar para o Diagrama Atual',
            override_alert: {
                title: 'Importar Banco de Dados',
                content: {
                    alert: 'A importação deste diagrama afetará tabelas e relacionamentos existentes.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> novas tabelas serão adicionadas.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> novos relacionamentos serão criados.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> tabelas serão sobrescritas.',
                    proceed: 'Você deseja continuar?',
                },
                import: 'Importar',
                cancel: 'Cancelar',
            },
        },

        export_image_dialog: {
            title: 'Exportar Imagem',
            description: 'Escolha o fator de escala para exportação:',
            scale_1x: '1x Normal',
            scale_2x: '2x (Recomendado)',
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
            title: 'Selecionar Esquema',
            description:
                'Múltiplos esquemas estão sendo exibidos. Selecione um para a nova tabela.',
            cancel: 'Cancelar',
            confirm: 'Confirmar',
        },

        update_table_schema_dialog: {
            title: 'Alterar Esquema',
            description: 'Atualizar o esquema da tabela "{{tableName}}"',
            cancel: 'Cancelar',
            confirm: 'Alterar',
        },

        create_table_schema_dialog: {
            title: 'Criar Novo Esquema',
            description:
                'Ainda não existem esquemas. Crie seu primeiro esquema para organizar suas tabelas.',
            create: 'Criar',
            cancel: 'Cancelar',
        },

        star_us_dialog: {
            title: 'Ajude-nos a melhorar!',
            description:
                'Gostaria de nos avaliar com uma estrela no GitHub? É apenas um clique!',
            close: 'Agora não',
            confirm: 'Claro!',
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
            one_to_one: 'Um para Um',
            one_to_many: 'Um para Muitos',
            many_to_one: 'Muitos para Um',
            many_to_many: 'Muitos para Muitos',
        },

        canvas_context_menu: {
            new_table: 'Nova Tabela',
            new_view: 'Nova Visualização',
            new_relationship: 'Novo Relacionamento',
            // TODO: Translate
            new_area: 'New Area',
            new_note: 'Nova Nota',
        },

        table_node_context_menu: {
            edit_table: 'Editar Tabela',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: 'Excluir Tabela',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'Duplo clique para editar',
        },

        language_select: {
            change_language: 'Idioma',
        },

        on: 'Ligado',
        off: 'Desligado',
    },
};

export const pt_BRMetadata: LanguageMetadata = {
    name: 'Portuguese',
    nativeName: 'Português',
    code: 'pt_BR',
};
