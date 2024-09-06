import { LanguageTranslation } from '../types';

export const fr: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Fichier',
                new: 'Nouveau',
                open: 'Ouvrir',
                save: 'Sauvegarder',
                export_sql: 'Exporter SQL',
                export_as: 'Exporter sous',
                delete_diagram: 'Supprimer le Diagramme',
                exit: 'Exit',
            },
            edit: {
                edit: 'Editer',
                undo: 'Annuler',
                redo: 'Refaire',
                clear: 'Nettoyer',
            },
            view: {
                view: 'Vue',
                show_sidebar: 'Afficher la barre latérale',
                hide_sidebar: 'Cacher la barre latérale',
                theme: 'Thème',
                change_language: 'Langue',
            },
            help: {
                help: 'Aide',
                visit_website: 'Visiter ChartDB',
                join_discord: 'Nous rejoindre sur Discord',
            },
        },

        delete_diagram_alert: {
            title: 'Supprimer le Diagramme',
            description:
                'Cette action ne peut être annulée. Cette action supprimera définitivement le diagramme.',
            cancel: 'Annuler',
            delete: 'Supprimer',
        },

        clear_diagram_alert: {
            title: 'Nettoyer le Diagramme',
            description:
                'Cette action ne peut être annulée. Elle supprime définitivement toutes les données du diagramme.',
            cancel: 'Annuler',
            clear: 'Nettoyer',
        },

        theme: {
            system: 'Système',
            light: 'Clair',
            dark: 'Sombre',
        },

        last_saved: 'Dernière sauvegarde',
        saved: 'Sauvegardé',
        diagrams: 'Diagrammes',
        loading_diagram: 'Chargement du diagrame...',

        side_panel: {
            view_all_options: 'Voir toutes les options...',
            tables_section: {
                tables: 'Tables',
                add_table: 'Ajouter une Table',
                filter: 'Filtrer',
                collapse: 'Tout réduire',

                table: {
                    fields: 'Champs',
                    nullable: 'Nullable?',
                    primary_key: 'Clé primaire',
                    indexes: 'Index',
                    comments: 'Commentaires',
                    no_comments: 'Pas de commentaire',
                    add_field: 'Ajouter un champ',
                    add_index: 'Ajouter un index',
                    index_select_fields: 'Choisir les champs',
                    field_name: 'Nom',
                    field_type: 'Type',
                    field_actions: {
                        title: 'Attributs du champ',
                        unique: 'Unique',
                        comments: 'Commentairess',
                        no_comments: 'Pas de commentaires',
                        delete_field: 'Supprimer le champ',
                    },
                    index_actions: {
                        title: "Attributs de l'index",
                        name: 'Nom',
                        unique: 'Unique',
                        delete_index: "Supprimer l'index",
                    },
                    table_actions: {
                        title: 'Actions de la table',
                        add_field: 'Ajouter un champ',
                        add_index: 'Ajouter un index',
                        delete_table: 'Supprimer la table',
                    },
                },
                empty_state: {
                    title: 'Pas de tables',
                    description: 'Créer une table pour commencer',
                },
            },
            relationships_section: {
                relationships: 'Relations',
                filter: 'Filtrer',
                collapse: 'Tout réduire',
                relationship: {
                    primary: 'Primaire',
                    foreign: 'Etrangère',
                    cardinality: 'Cardinalité',
                    delete_relationship: 'Supprimer',
                    relationship_actions: {
                        title: 'Actions',
                        delete_relationship: 'Action',
                    },
                },
                empty_state: {
                    title: 'Pas de relations',
                    description: 'Créer une relation pour connecter les tables',
                },
            },
        },

        toolbar: {
            zoom_in: 'Zoom avant',
            zoom_out: 'Zoom arrière',
            save: 'Sauvegarder',
            show_all: 'Tout montrer',
            undo: 'Annuler',
            redo: 'Refaire',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Quelle est votre base de données ?',
                description:
                    'Chaque base de données possède ses propres fonctionnalités et capacités.',
                check_examples_long: 'Regarder les exemples',
                check_examples_short: 'Examples',
            },

            import_database: {
                title: 'Importer votre base de données',
                database_edition: 'Édition de la base de données:',
                step_1: 'Executer ce script dans votre base de données:',
                step_2: 'Coller le résultat du script ici:',
                script_results_placeholder: 'Résultats du script ici...',
                ssms_instructions: {
                    button_text: 'Instructions SSMS',
                    title: 'Instructions',
                    step_1: 'Allez dans Outils > Options > Résultats de la requête > SQL Server.',
                    step_2: 'Si vous utiliez "Résultats en grille", changer le le nombre maximum de caractères récupérés pour les données non XML (fixé à 9999999)',
                },
            },

            cancel: 'Cancel',
            back: 'Retour',
            empty_diagram: 'Diagramme Vide',
            continue: 'Continuer',
            import: 'Importer',
        },

        open_diagram_dialog: {
            title: 'Ouvrir le Diagramme',
            description:
                'Sélectionnez un diagramme à ouvrir dans la liste ci-dessous.',
            table_columns: {
                name: 'Nom',
                created_at: 'Créée à',
                last_modified: 'Dernière modification',
                tables_count: 'Tables',
            },
            cancel: 'Annuler',
            open: 'Ouvrir',
        },

        export_sql_dialog: {
            title: 'Exporter SQL',
            description:
                'Exporter votre schéma de diagramme vers le script {{databaseType}}',
            close: 'Fermer',
            loading: {
                text: "L'IA est entrain de générer le SQL pour {{databaseType}}...",
                description:
                    "Cette opération devrait prendre jusqu'à 30 secondes.",
            },
            error: {
                message:
                    'Erreur lors de la génération du script SQL. Veuillez réessayer plus tard ou <0>contactez-nous</0>.',
                description:
                    "N'hésitez pas à utiliser votre OPENAI_TOKEN, voir le manuel <0>ici</0>.",
            },
        },

        relationship_type: {
            one_to_one: 'Un à un',
            one_to_many: 'Un à plusieus',
            many_to_one: 'Plusieurs à un',
        },
    },
};

export const frMetadata = {
    name: 'Français',
    code: 'fr',
};
