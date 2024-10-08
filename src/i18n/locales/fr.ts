import type { LanguageMetadata, LanguageTranslation } from '../types';

export const fr: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Fichier',
                new: 'Nouveau',
                open: 'Ouvrir',
                save: 'Enregistrer',
                import_database: 'Importer Base de Données',
                export_sql: 'Exporter SQL',
                export_as: 'Exporter en tant que',
                delete_diagram: 'Supprimer le Diagramme',
                exit: 'Quitter',
            },
            edit: {
                edit: 'Éditer',
                undo: 'Annuler',
                redo: 'Rétablir',
                clear: 'Effacer',
            },
            view: {
                view: 'Affichage',
                show_sidebar: 'Afficher la Barre Latérale',
                hide_sidebar: 'Cacher la Barre Latérale',
                hide_cardinality: 'Cacher la Cardinalité',
                show_cardinality: 'Afficher la Cardinalité',
                zoom_on_scroll: 'Zoom sur le Défilement',
                theme: 'Thème',
                change_language: 'Langue',
                // TODO: Translate
                show_dependencies: 'Show Dependencies',
                hide_dependencies: 'Hide Dependencies',
            },
            help: {
                help: 'Aide',
                visit_website: 'Visitez ChartDB',
                join_discord: 'Rejoignez-nous sur Discord',
                schedule_a_call: 'Parlez avec nous !',
            },
        },

        delete_diagram_alert: {
            title: 'Supprimer le Diagramme',
            description:
                'Cette action est irréversible. Cela supprimera définitivement le diagramme.',
            cancel: 'Annuler',
            delete: 'Supprimer',
        },

        clear_diagram_alert: {
            title: 'Effacer le Diagramme',
            description:
                'Cette action est irréversible. Cela supprimera définitivement toutes les données dans le diagramme.',
            cancel: 'Annuler',
            clear: 'Effacer',
        },

        reorder_diagram_alert: {
            title: 'Réorganiser le Diagramme',
            description:
                'Cette action réorganisera toutes les tables dans le diagramme. Voulez-vous continuer ?',
            reorder: 'Réorganiser',
            cancel: 'Annuler',
        },

        theme: {
            system: 'Système',
            light: 'Clair',
            dark: 'Sombre',
        },

        zoom: {
            on: 'Activé',
            off: 'Désactivé',
        },

        last_saved: 'Dernière sauvegarde',
        saved: 'Enregistré',
        diagrams: 'Diagrammes',
        loading_diagram: 'Chargement du diagramme...',
        deselect_all: 'Tout désélectionner',
        select_all: 'Tout sélectionner',
        clear: 'Effacer',
        show_more: 'Afficher Plus',
        show_less: 'Afficher Moins',

        side_panel: {
            schema: 'Schéma:',
            filter_by_schema: 'Filtrer par schéma',
            search_schema: 'Rechercher un schéma...',
            no_schemas_found: 'Aucun schéma trouvé.',
            view_all_options: 'Voir toutes les Options...',
            tables_section: {
                tables: 'Tables',
                add_table: 'Ajouter une Table',
                filter: 'Filtrer',
                collapse: 'Réduire Tout',

                table: {
                    fields: 'Champs',
                    nullable: 'Nullable?',
                    primary_key: 'Clé Primaire',
                    indexes: 'Index',
                    comments: 'Commentaires',
                    no_comments: 'Pas de commentaires',
                    add_field: 'Ajouter un Champ',
                    add_index: 'Ajouter un Index',
                    index_select_fields: 'Sélectionner des champs',
                    no_types_found: 'Aucun type trouvé',
                    field_name: 'Nom',
                    field_type: 'Type',
                    field_actions: {
                        title: 'Attributs du Champ',
                        unique: 'Unique',
                        comments: 'Commentaires',
                        no_comments: 'Pas de commentaires',
                        delete_field: 'Supprimer le Champ',
                    },
                    index_actions: {
                        title: "Attributs de l'Index",
                        name: 'Nom',
                        unique: 'Unique',
                        delete_index: "Supprimer l'Index",
                    },
                    table_actions: {
                        title: 'Actions de la Table',
                        add_field: 'Ajouter un Champ',
                        add_index: 'Ajouter un Index',
                        delete_table: 'Supprimer la Table',
                        change_schema: 'Changer le Schéma',
                    },
                },
                empty_state: {
                    title: 'Aucune table',
                    description: 'Créez une table pour commencer',
                },
            },
            relationships_section: {
                relationships: 'Relations',
                filter: 'Filtrer',
                add_relationship: 'Ajouter une Relation',
                collapse: 'Réduire Tout',
                relationship: {
                    primary: 'Table Principale',
                    foreign: 'Table Référencée',
                    cardinality: 'Cardinalité',
                    delete_relationship: 'Supprimer',
                    relationship_actions: {
                        title: 'Actions',
                        delete_relationship: 'Supprimer',
                    },
                },
                empty_state: {
                    title: 'Aucune relation',
                    description: 'Créez une relation pour connecter les tables',
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
            zoom_in: 'Zoom Avant',
            zoom_out: 'Zoom Arrière',
            save: 'Enregistrer',
            show_all: 'Afficher Tout',
            undo: 'Annuler',
            redo: 'Rétablir',
            reorder_diagram: 'Réorganiser le Diagramme',
            // TODO: Translate
            highlight_overlapping_tables: 'Highlight Overlapping Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Quelle est votre Base de Données ?',
                description:
                    'Chaque base de données a ses propres fonctionnalités et capacités uniques.',
                check_examples_long: 'Voir les Exemples',
                check_examples_short: 'Exemples',
            },

            import_database: {
                title: 'Importer votre Base de Données',
                database_edition: 'Édition de la Base de Données :',
                step_1: 'Exécutez ce script dans votre base de données :',
                step_2: 'Collez le résultat du script ici :',
                script_results_placeholder: 'Résultats du script ici...',
                ssms_instructions: {
                    button_text: 'Instructions SSMS',
                    title: 'Instructions',
                    step_1: 'Allez dans Outils > Options > Résultats des Requêtes > SQL Server.',
                    step_2: 'Si vous utilisez "Résultats en Grille", changez le nombre maximum de caractères récupérés pour les données non-XML (définir à 9999999).',
                },
                // TODO: Translate
                instructions_link: 'Need help? Watch how',
            },

            cancel: 'Annuler',
            back: 'Retour',
            empty_diagram: 'Diagramme vide',
            continue: 'Continuer',
            import: 'Importer',
        },

        open_diagram_dialog: {
            title: 'Ouvrir Diagramme',
            description:
                'Sélectionnez un diagramme à ouvrir dans la liste ci-dessous.',
            table_columns: {
                name: 'Nom',
                created_at: 'Créé le',
                last_modified: 'Dernière modification',
                tables_count: 'Tables',
            },
            cancel: 'Annuler',
            open: 'Ouvrir',
        },

        export_sql_dialog: {
            title: 'Exporter SQL',
            description:
                'Exportez le schéma de votre diagramme en script {{databaseType}}',
            close: 'Fermer',
            loading: {
                text: "L'IA génère un SQL pour {{databaseType}}...",
                description: "Cela devrait prendre jusqu'à 30 secondes.",
            },
            error: {
                message:
                    'Erreur lors de la génération du script SQL. Veuillez réessayer plus tard ou <0>contactez-nous</0>.',
                description:
                    "N'hésitez pas à utiliser votre OPENAI_TOKEN, voir le manuel <0>ici</0>.",
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

        // TODO: Translate
        multiple_schemas_alert: {
            title: 'Multiple Schemas',
            description:
                '{{schemasCount}} schemas in this diagram. Currently displaying: {{formattedSchemas}}.',
            dont_show_again: "Don't show again",
            change_schema: 'Change',
            none: 'none',
        },

        // TODO: Translate
        new_table_schema_dialog: {
            title: 'Select Schema',
            description:
                'Multiple schemas are currently displayed. Select one for the new table.',
            cancel: 'Cancel',
            confirm: 'Confirm',
        },

        // TODO: Translate
        star_us_dialog: {
            title: 'Help us improve!',
            description:
                "Would you like to star us on GitHub? It's just a click away!",
            close: 'Not now',
            confirm: 'Of course!',
        },

        // TODO: Translate
        update_table_schema_dialog: {
            title: 'Change Schema',
            description: 'Update table "{{tableName}}" schema',
            cancel: 'Cancel',
            confirm: 'Change',
        },

        create_relationship_dialog: {
            title: 'Créer une Relation',
            primary_table: 'Table Principale',
            primary_field: 'Champ Principal',
            referenced_table: 'Table Référencée',
            referenced_field: 'Champ Référencé',
            primary_table_placeholder: 'Sélectionner une table',
            primary_field_placeholder: 'Sélectionner un champ',
            referenced_table_placeholder: 'Sélectionner une table',
            referenced_field_placeholder: 'Sélectionner un champ',
            no_tables_found: 'Aucune table trouvée',
            no_fields_found: 'Aucun champ trouvé',
            create: 'Créer',
            cancel: 'Annuler',
        },

        import_database_dialog: {
            title: 'Importer dans le Diagramme Actuel',
            override_alert: {
                title: 'Importer Base de Données',
                content: {
                    alert: "L'importation de ce diagramme affectera les tables et relations existantes.",
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> nouvelles tables seront ajoutées.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> nouvelles relations seront créées.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> tables seront écrasées.',
                    proceed: 'Voulez-vous continuer ?',
                },
                import: 'Importer',
                cancel: 'Annuler',
            },
        },

        relationship_type: {
            one_to_one: 'Un à Un',
            one_to_many: 'Un à Plusieurs',
            many_to_one: 'Plusieurs à Un',
            many_to_many: 'Plusieurs à Plusieurs',
        },

        canvas_context_menu: {
            new_table: 'Nouvelle Table',
            new_relationship: 'Nouvelle Relation',
        },

        table_node_context_menu: {
            edit_table: 'Éditer la Table',
            delete_table: 'Supprimer la Table',
        },
    },
};

export const frMetadata: LanguageMetadata = {
    name: 'Français',
    code: 'fr',
};
