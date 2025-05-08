import type { LanguageMetadata, LanguageTranslation } from '../types';

export const fr: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Fichier',
                new: 'Nouveau',
                open: 'Ouvrir',
                save: 'Enregistrer',
                import: 'Importer Base de Données',
                export_sql: 'Exporter SQL',
                export_as: 'Exporter en tant que',
                delete_diagram: 'Supprimer le Diagramme',
                exit: 'Quitter',
            },
            edit: {
                edit: 'Édition',
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
                show_dependencies: 'Afficher les Dépendances',
                hide_dependencies: 'Masquer les Dépendances',
                show_minimap: 'Afficher la Mini Carte',
                hide_minimap: 'Masquer la Mini Carte',
            },
            backup: {
                backup: 'Sauvegarde',
                export_diagram: 'Exporter le diagramme',
                restore_diagram: 'Restaurer le diagramme',
            },
            help: {
                help: 'Aide',
                docs_website: 'Documentation',
                join_discord: 'Rejoignez-nous sur Discord',
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

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Échec de la copie',
                description: 'Presse-papiers non pris en charge',
            },
            failed: {
                title: 'Échec de la copie',
                description: 'Quelque chose a mal tourné. Veuillez réessayer.',
            },
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
        loading_diagram: 'Chargement du diagramme...',
        deselect_all: 'Tout désélectionner',
        select_all: 'Tout sélectionner',
        clear: 'Effacer',
        show_more: 'Afficher Plus',
        show_less: 'Afficher Moins',
        copy_to_clipboard: 'Copier dans le presse-papiers',
        copied: 'Copié !',

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
                clear: 'Effacer le Filtre',
                no_results:
                    'Aucune table trouvée correspondant à votre filtre.',
                show_list: 'Afficher la Liste des Tableaux',
                show_dbml: "Afficher l'éditeur DBML",

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
                        // TODO: Translate
                        character_length: 'Max Length',
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
                        duplicate_table: 'Tableau dupliqué',
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
            dependencies_section: {
                dependencies: 'Dépendances',
                filter: 'Filtrer',
                collapse: 'Réduire Tout',
                dependency: {
                    table: 'Table',
                    dependent_table: 'Vue Dépendante',
                    delete_dependency: 'Supprimer',
                    dependency_actions: {
                        title: 'Actions',
                        delete_dependency: 'Supprimer',
                    },
                },
                empty_state: {
                    title: 'Aucune dépendance',
                    description: 'Créez une vue pour commencer',
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
            zoom_in: 'Zoom Avant',
            zoom_out: 'Zoom Arrière',
            save: 'Enregistrer',
            show_all: 'Afficher Tout',
            undo: 'Annuler',
            redo: 'Rétablir',
            reorder_diagram: 'Réorganiser le Diagramme',
            highlight_overlapping_tables: 'Surligner les tables chevauchées',
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
                instructions_link: "Besoin d'aide ? Regardez comment",
                check_script_result: 'Vérifier le résultat du Script',
            },

            cancel: 'Annuler',
            back: 'Retour',
            import_from_file: "Importer à partir d'un fichier",
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

        export_image_dialog: {
            title: "Exporter l'image",
            description:
                "Choisissez le facteur d'échelle pour l'image exportée.",
            scale_1x: '1x Normal',
            scale_2x: '2x (Recommandé)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Annuler',
            export: 'Exporter',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        multiple_schemas_alert: {
            title: 'Schémas Multiples',
            description:
                '{{schemasCount}} schémas dans ce diagramme. Actuellement affiché(s) : {{formattedSchemas}}.',
            dont_show_again: 'Ne plus afficher',
            change_schema: 'Changer',
            none: 'Aucun',
        },

        new_table_schema_dialog: {
            title: 'Sélectionner un Schéma',
            description:
                'Plusieurs schémas sont actuellement affichés. Sélectionnez-en un pour la nouvelle table.',
            cancel: 'Annuler',
            confirm: 'Confirmer',
        },

        star_us_dialog: {
            title: 'Aidez-nous à nous améliorer',
            description:
                "Souhaitez-vous nous donner une étoile sur GitHub ? Il ne suffit que d'un clic !",
            close: 'Pas maintenant',
            confirm: 'Bien sûr !',
        },

        update_table_schema_dialog: {
            title: 'Modifier le Schéma',
            description: 'Mettre à jour le schéma de la table "{{tableName}}"',
            cancel: 'Annuler',
            confirm: 'Modifier',
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
        export_diagram_dialog: {
            title: 'Exporter le Diagramme',
            description: "Sélectionner le format d'exportation :",
            format_json: 'JSON',
            cancel: 'Annuler',
            export: 'Exporter',
            error: {
                title: "Erreur lors de l'exportation du diagramme",
                description:
                    "Une erreur s'est produite. Besoin d'aide ? support@chartdb.io",
            },
        },
        import_diagram_dialog: {
            title: 'Importer un diagramme',
            description: 'Coller le diagramme au format JSON ci-dessous :',
            cancel: 'Annuler',
            import: 'Exporter',
            error: {
                title: "Erreur lors de l'exportation du diagramme",
                description:
                    "Le diagramme JSON n'est pas valide. Veuillez vérifier le JSON et réessayer. Besoin d'aide ? support@chartdb.io",
            },
        },
        import_dbml_dialog: {
            example_title: "Exemple d'importation DBML",
            title: 'Import DBML',
            description:
                'Importer un schéma de base de données à partir du format DBML.',
            import: 'Importer',
            cancel: 'Annuler',
            skip_and_empty: 'Passer et vider',
            show_example: 'Afficher un exemple',
            error: {
                title: 'Erreur',
                description:
                    "Erreur d'analyse du DBML. Veuillez vérifier la syntaxe.",
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
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'Éditer la Table',
            duplicate_table: 'Tableau Dupliqué',
            delete_table: 'Supprimer la Table',
            add_relationship: 'Ajouter une Relation',
        },

        snap_to_grid_tooltip:
            'Aligner sur la grille (maintenir la touche {{key}})',

        tool_tips: {
            double_click_to_edit: 'Double-cliquez pour modifier',
        },

        language_select: {
            change_language: 'Langue',
        },
    },
};

export const frMetadata: LanguageMetadata = {
    name: 'French',
    nativeName: 'Français',
    code: 'fr',
};
