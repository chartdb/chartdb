import type { LanguageMetadata, LanguageTranslation } from '../types';

export const pt_BR: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Arquivo',
                new: 'Novo',
                open: 'Abrir',
                save: 'Salvar',
                import: 'Importar Banco de Dados',
                export_sql: 'Exportar SQL',
                export_as: 'Exportar como',
                delete_diagram: 'Excluir Diagrama',
                exit: 'Sair',
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
                zoom_on_scroll: 'Zoom ao Rolar',
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
            title: 'Reordenar Diagrama',
            description:
                'Esta ação reorganizará todas as tabelas no diagrama. Deseja continuar?',
            reorder: 'Reordenar',
            cancel: 'Cancelar',
        },

        multiple_schemas_alert: {
            title: 'Múltiplos Esquemas',
            description:
                '{{schemasCount}} esquemas neste diagrama. Atualmente exibindo: {{formattedSchemas}}.',
            dont_show_again: 'Não mostrar novamente',
            change_schema: 'Alterar',
            none: 'nenhum',
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
            schema: 'Esquema:',
            filter_by_schema: 'Filtrar por esquema',
            search_schema: 'Buscar esquema...',
            no_schemas_found: 'Nenhum esquema encontrado.',
            view_all_options: 'Ver todas as Opções...',
            tables_section: {
                tables: 'Tabelas',
                add_table: 'Adicionar Tabela',
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
                        comments: 'Comentários',
                        no_comments: 'Sem comentários',
                        delete_field: 'Excluir Campo',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'Atributos do Índice',
                        name: 'Nome',
                        unique: 'Único',
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
            relationships_section: {
                relationships: 'Relacionamentos',
                filter: 'Filtrar',
                add_relationship: 'Adicionar Relacionamento',
                collapse: 'Colapsar Todas',
                relationship: {
                    primary: 'Tabela Primária',
                    foreign: 'Tabela Referenciada',
                    cardinality: 'Cardinalidade',
                    delete_relationship: 'Excluir',
                    relationship_actions: {
                        title: 'Ações',
                        delete_relationship: 'Excluir',
                    },
                },
                empty_state: {
                    title: 'Sem relacionamentos',
                    description: 'Crie um relacionamento para conectar tabelas',
                },
            },
            dependencies_section: {
                dependencies: 'Dependências',
                filter: 'Filtrar',
                collapse: 'Colapsar Todas',
                dependency: {
                    table: 'Tabela',
                    dependent_table: 'Visualização Dependente',
                    delete_dependency: 'Excluir',
                    dependency_actions: {
                        title: 'Ações',
                        delete_dependency: 'Excluir',
                    },
                },
                empty_state: {
                    title: 'Sem dependências',
                    description: 'Crie uma visualização para começar',
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
            zoom_in: 'Aumentar Zoom',
            zoom_out: 'Diminuir Zoom',
            save: 'Salvar',
            show_all: 'Mostrar Tudo',
            undo: 'Desfazer',
            redo: 'Refazer',
            reorder_diagram: 'Reordenar Diagrama',
            highlight_overlapping_tables: 'Destacar Tabelas Sobrepostas',
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
                step_2: 'Cole o resultado do script aqui:',
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
            empty_diagram: 'Diagrama vazio',
            continue: 'Continuar',
            import: 'Importar',
        },

        open_diagram_dialog: {
            title: 'Abrir Diagrama',
            description: 'Selecione um diagrama para abrir da lista abaixo.',
            table_columns: {
                name: 'Nome',
                created_at: 'Criado em',
                last_modified: 'Última Modificação',
                tables_count: 'Tabelas',
            },
            cancel: 'Cancelar',
            open: 'Abrir',
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
            new_relationship: 'Novo Relacionamento',
            // TODO: Translate
            new_area: 'New Area',
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
    },
};

export const pt_BRMetadata: LanguageMetadata = {
    name: 'Portuguese',
    nativeName: 'Português',
    code: 'pt_BR',
};
