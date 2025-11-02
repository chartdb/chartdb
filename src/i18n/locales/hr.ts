import type { LanguageMetadata, LanguageTranslation } from '../types';

export const hr: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Novi',
            browse: 'Pregledaj',
            tables: 'Tablice',
            refs: 'Refs',
            dependencies: 'Ovisnosti',
            custom_types: 'Prilagođeni Tipovi',
            visuals: 'Vizuali',
        },
        menu: {
            actions: {
                actions: 'Akcije',
                new: 'Novi...',
                browse: 'Pregledaj...',
                save: 'Spremi',
                import: 'Uvezi',
                export_sql: 'Izvezi SQL',
                export_as: 'Izvezi kao',
                delete_diagram: 'Izbriši',
            },
            edit: {
                edit: 'Uredi',
                undo: 'Poništi',
                redo: 'Ponovi',
                clear: 'Očisti',
            },
            view: {
                view: 'Prikaz',
                show_sidebar: 'Prikaži bočnu traku',
                hide_sidebar: 'Sakrij bočnu traku',
                hide_cardinality: 'Sakrij kardinalnost',
                show_cardinality: 'Prikaži kardinalnost',
                hide_field_attributes: 'Sakrij atribute polja',
                show_field_attributes: 'Prikaži atribute polja',
                zoom_on_scroll: 'Zumiranje pri skrolanju',
                show_views: 'Pogledi Baze Podataka',
                theme: 'Tema',
                show_dependencies: 'Prikaži ovisnosti',
                hide_dependencies: 'Sakrij ovisnosti',
                show_minimap: 'Prikaži mini kartu',
                hide_minimap: 'Sakrij mini kartu',
            },
            backup: {
                backup: 'Sigurnosna kopija',
                export_diagram: 'Izvezi dijagram',
                restore_diagram: 'Vrati dijagram',
            },
            help: {
                help: 'Pomoć',
                docs_website: 'Dokumentacija',
                join_discord: 'Pridružite nam se na Discordu',
            },
        },

        delete_diagram_alert: {
            title: 'Izbriši dijagram',
            description:
                'Ova radnja se ne može poništiti. Ovo će trajno izbrisati dijagram.',
            cancel: 'Odustani',
            delete: 'Izbriši',
        },

        clear_diagram_alert: {
            title: 'Očisti dijagram',
            description:
                'Ova radnja se ne može poništiti. Ovo će trajno izbrisati sve podatke u dijagramu.',
            cancel: 'Odustani',
            clear: 'Očisti',
        },

        reorder_diagram_alert: {
            title: 'Automatski preuredi dijagram',
            description:
                'Ova radnja će preurediti sve tablice u dijagramu. Želite li nastaviti?',
            reorder: 'Automatski preuredi',
            cancel: 'Odustani',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Kopiranje neuspješno',
                description: 'Međuspremnik nije podržan.',
            },
            failed: {
                title: 'Kopiranje neuspješno',
                description: 'Nešto je pošlo po zlu. Molimo pokušajte ponovno.',
            },
        },

        theme: {
            system: 'Sustav',
            light: 'Svijetla',
            dark: 'Tamna',
        },

        zoom: {
            on: 'Uključeno',
            off: 'Isključeno',
        },

        last_saved: 'Zadnje spremljeno',
        saved: 'Spremljeno',
        loading_diagram: 'Učitavanje dijagrama...',
        deselect_all: 'Odznači sve',
        select_all: 'Označi sve',
        clear: 'Očisti',
        show_more: 'Prikaži više',
        show_less: 'Prikaži manje',
        copy_to_clipboard: 'Kopiraj u međuspremnik',
        copied: 'Kopirano!',

        side_panel: {
            view_all_options: 'Prikaži sve opcije...',
            tables_section: {
                tables: 'Tablice',
                add_table: 'Dodaj tablicu',
                add_view: 'Dodaj Pogled',
                filter: 'Filtriraj',
                collapse: 'Sažmi sve',
                clear: 'Očisti filter',
                no_results:
                    'Nema pronađenih tablica koje odgovaraju vašem filteru.',
                show_list: 'Prikaži popis tablica',
                show_dbml: 'Prikaži DBML uređivač',

                table: {
                    fields: 'Polja',
                    nullable: 'Može biti null?',
                    primary_key: 'Primarni ključ',
                    indexes: 'Indeksi',
                    comments: 'Komentari',
                    no_comments: 'Nema komentara',
                    add_field: 'Dodaj polje',
                    add_index: 'Dodaj indeks',
                    index_select_fields: 'Odaberi polja',
                    no_types_found: 'Nema pronađenih tipova',
                    field_name: 'Naziv',
                    field_type: 'Tip',
                    field_actions: {
                        title: 'Atributi polja',
                        unique: 'Jedinstven',
                        auto_increment: 'Automatsko povećavanje',
                        character_length: 'Maksimalna dužina',
                        precision: 'Preciznost',
                        scale: 'Skala',
                        comments: 'Komentari',
                        no_comments: 'Nema komentara',
                        default_value: 'Zadana vrijednost',
                        no_default: 'Nema zadane vrijednosti',
                        delete_field: 'Izbriši polje',
                    },
                    index_actions: {
                        title: 'Atributi indeksa',
                        name: 'Naziv',
                        unique: 'Jedinstven',
                        index_type: 'Vrsta indeksa',
                        delete_index: 'Izbriši indeks',
                    },
                    table_actions: {
                        title: 'Radnje nad tablicom',
                        change_schema: 'Promijeni shemu',
                        add_field: 'Dodaj polje',
                        add_index: 'Dodaj indeks',
                        duplicate_table: 'Dupliciraj tablicu',
                        delete_table: 'Izbriši tablicu',
                    },
                },
                empty_state: {
                    title: 'Nema tablica',
                    description: 'Stvorite tablicu za početak',
                },
            },
            refs_section: {
                refs: 'Refs',
                filter: 'Filtriraj',
                collapse: 'Sažmi sve',
                add_relationship: 'Dodaj vezu',
                relationships: 'Veze',
                dependencies: 'Ovisnosti',
                relationship: {
                    relationship: 'Veza',
                    primary: 'Primarna tablica',
                    foreign: 'Referentna tablica',
                    cardinality: 'Kardinalnost',
                    delete_relationship: 'Izbriši',
                    relationship_actions: {
                        title: 'Radnje',
                        delete_relationship: 'Izbriši',
                    },
                },
                dependency: {
                    dependency: 'Ovisnost',
                    table: 'Tablica',
                    dependent_table: 'Ovisni pogled',
                    delete_dependency: 'Izbriši',
                    dependency_actions: {
                        title: 'Radnje',
                        delete_dependency: 'Izbriši',
                    },
                },
                empty_state: {
                    title: 'Nema veze',
                    description: 'Stvorite vezu za početak',
                },
            },

            areas_section: {
                areas: 'Područja',
                add_area: 'Dodaj područje',
                filter: 'Filtriraj',
                clear: 'Očisti filter',
                no_results:
                    'Nema pronađenih područja koja odgovaraju vašem filteru.',

                area: {
                    area_actions: {
                        title: 'Radnje nad područjem',
                        edit_name: 'Uredi naziv',
                        delete_area: 'Izbriši područje',
                    },
                },
                empty_state: {
                    title: 'Nema područja',
                    description: 'Stvorite područje za početak',
                },
            },

            visuals_section: {
                visuals: 'Vizuali',
                tabs: {
                    areas: 'Područja',
                    notes: 'Bilješke',
                },
            },

            notes_section: {
                filter: 'Filtriraj',
                add_note: 'Dodaj Bilješku',
                no_results: 'Nije pronađena nijedna bilješka',
                clear: 'Očisti Filter',
                empty_state: {
                    title: 'Nema Bilješki',
                    description:
                        'Kreirajte bilješku za dodavanje tekstualnih napomena na platnu',
                },
                note: {
                    empty_note: 'Prazna bilješka',
                    note_actions: {
                        title: 'Akcije Bilješke',
                        edit_content: 'Uredi Sadržaj',
                        delete_note: 'Obriši Bilješku',
                    },
                },
            },

            custom_types_section: {
                custom_types: 'Prilagođeni tipovi',
                filter: 'Filtriraj',
                clear: 'Očisti filter',
                no_results:
                    'Nema pronađenih prilagođenih tipova koji odgovaraju vašem filteru.',
                empty_state: {
                    title: 'Nema prilagođenih tipova',
                    description:
                        'Prilagođeni tipovi će se pojaviti ovdje kada budu dostupni u vašoj bazi podataka',
                },
                custom_type: {
                    kind: 'Vrsta',
                    enum_values: 'Enum vrijednosti',
                    composite_fields: 'Polja',
                    no_fields: 'Nema definiranih polja',
                    no_values: 'Nema definiranih enum vrijednosti',
                    field_name_placeholder: 'Naziv polja',
                    field_type_placeholder: 'Odaberi tip',
                    add_field: 'Dodaj polje',
                    no_fields_tooltip:
                        'Nema definiranih polja za ovaj prilagođeni tip',
                    custom_type_actions: {
                        title: 'Radnje',
                        highlight_fields: 'Istakni polja',
                        clear_field_highlight: 'Ukloni isticanje',
                        delete_custom_type: 'Izbriši',
                    },
                    delete_custom_type: 'Izbriši tip',
                },
            },
        },

        toolbar: {
            zoom_in: 'Uvećaj',
            zoom_out: 'Smanji',
            save: 'Spremi',
            show_all: 'Prikaži sve',
            undo: 'Poništi',
            redo: 'Ponovi',
            reorder_diagram: 'Automatski preuredi dijagram',
            highlight_overlapping_tables: 'Istakni preklapajuće tablice',
            clear_custom_type_highlight: 'Ukloni isticanje za "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Isticanje "{{typeName}}" - Kliknite za uklanjanje',
            filter: 'Filtriraj tablice',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Koja je vaša baza podataka?',
                description:
                    'Svaka baza podataka ima svoje jedinstvene značajke i mogućnosti.',
                check_examples_long: 'Pogledaj primjere',
                check_examples_short: 'Primjeri',
            },

            import_database: {
                title: 'Uvezite svoju bazu podataka',
                database_edition: 'Verzija baze podataka:',
                step_1: 'Pokrenite ovu skriptu u svojoj bazi podataka:',
                step_2: 'Zalijepite rezultat skripte u ovaj dio →',
                script_results_placeholder: 'Rezultati skripte ovdje...',
                ssms_instructions: {
                    button_text: 'SSMS upute',
                    title: 'Upute',
                    step_1: 'Idite na Tools > Options > Query Results > SQL Server.',
                    step_2: 'Ako koristite "Results to Grid," promijenite Maximum Characters Retrieved za Non-XML podatke (postavite na 9999999).',
                },
                instructions_link: 'Trebate pomoć? Pogledajte kako',
                check_script_result: 'Provjeri rezultat skripte',
            },

            cancel: 'Odustani',
            import_from_file: 'Uvezi iz datoteke',
            back: 'Natrag',
            empty_diagram: 'Prazna baza podataka',
            continue: 'Nastavi',
            import: 'Uvezi',
        },

        open_diagram_dialog: {
            title: 'Otvori bazu podataka',
            description: 'Odaberite dijagram za otvaranje iz popisa ispod.',
            table_columns: {
                name: 'Naziv',
                created_at: 'Stvoreno',
                last_modified: 'Zadnje izmijenjeno',
                tables_count: 'Tablice',
            },
            cancel: 'Odustani',
            open: 'Otvori',

            diagram_actions: {
                open: 'Otvori',
                duplicate: 'Dupliciraj',
                delete: 'Obriši',
            },
        },

        export_sql_dialog: {
            title: 'Izvezi SQL',
            description:
                'Izvezite shemu vašeg dijagrama u {{databaseType}} skriptu',
            close: 'Zatvori',
            loading: {
                text: 'AI generira SQL za {{databaseType}}...',
                description: 'Ovo bi trebalo potrajati do 30 sekundi.',
            },
            error: {
                message:
                    'Greška pri generiranju SQL skripte. Molimo pokušajte ponovno kasnije ili <0>kontaktirajte nas</0>.',
                description:
                    'Slobodno koristite svoj OPENAI_TOKEN, pogledajte priručnik <0>ovdje</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Kreiraj vezu',
            primary_table: 'Primarna tablica',
            primary_field: 'Primarno polje',
            referenced_table: 'Referentna tablica',
            referenced_field: 'Referentno polje',
            primary_table_placeholder: 'Odaberi tablicu',
            primary_field_placeholder: 'Odaberi polje',
            referenced_table_placeholder: 'Odaberi tablicu',
            referenced_field_placeholder: 'Odaberi polje',
            no_tables_found: 'Nema pronađenih tablica',
            no_fields_found: 'Nema pronađenih polja',
            create: 'Kreiraj',
            cancel: 'Odustani',
        },

        import_database_dialog: {
            title: 'Uvezi u trenutni dijagram',
            override_alert: {
                title: 'Uvezi bazu podataka',
                content: {
                    alert: 'Uvoz ovog dijagrama će utjecati na postojeće tablice i veze.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> novih tablica će biti dodano.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> novih veza će biti stvoreno.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> tablica će biti prepisano.',
                    proceed: 'Želite li nastaviti?',
                },
                import: 'Uvezi',
                cancel: 'Odustani',
            },
        },

        export_image_dialog: {
            title: 'Izvezi sliku',
            description: 'Odaberite faktor veličine za izvoz:',
            scale_1x: '1x Obično',
            scale_2x: '2x (Preporučeno)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Odustani',
            export: 'Izvezi',
            advanced_options: 'Napredne opcije',
            pattern: 'Uključi pozadinski uzorak',
            pattern_description: 'Dodaj suptilni mrežni uzorak u pozadinu.',
            transparent: 'Prozirna pozadina',
            transparent_description: 'Ukloni boju pozadine iz slike.',
        },

        new_table_schema_dialog: {
            title: 'Odaberi shemu',
            description:
                'Trenutno je prikazano više shema. Odaberite jednu za novu tablicu.',
            cancel: 'Odustani',
            confirm: 'Potvrdi',
        },

        update_table_schema_dialog: {
            title: 'Promijeni shemu',
            description: 'Ažuriraj shemu tablice "{{tableName}}"',
            cancel: 'Odustani',
            confirm: 'Promijeni',
        },

        create_table_schema_dialog: {
            title: 'Stvori novu shemu',
            description:
                'Još ne postoje sheme. Stvorite svoju prvu shemu za organiziranje tablica.',
            create: 'Stvori',
            cancel: 'Odustani',
        },

        star_us_dialog: {
            title: 'Pomozite nam da se poboljšamo!',
            description:
                'Želite li nam dati zvjezdicu na GitHubu? Samo je jedan klik!',
            close: 'Ne sada',
            confirm: 'Naravno!',
        },
        export_diagram_dialog: {
            title: 'Izvezi dijagram',
            description: 'Odaberite format za izvoz:',
            format_json: 'JSON',
            cancel: 'Odustani',
            export: 'Izvezi',
            error: {
                title: 'Greška pri izvozu dijagrama',
                description:
                    'Nešto je pošlo po zlu. Trebate pomoć? support@chartdb.io',
            },
        },

        import_diagram_dialog: {
            title: 'Uvezi dijagram',
            description: 'Uvezite dijagram iz JSON datoteke.',
            cancel: 'Odustani',
            import: 'Uvezi',
            error: {
                title: 'Greška pri uvozu dijagrama',
                description:
                    'JSON dijagrama je nevažeći. Molimo provjerite JSON i pokušajte ponovno. Trebate pomoć? support@chartdb.io',
            },
        },

        import_dbml_dialog: {
            example_title: 'Uvezi primjer DBML-a',
            title: 'Uvezi DBML',
            description: 'Uvezite shemu baze podataka iz DBML formata.',
            import: 'Uvezi',
            cancel: 'Odustani',
            skip_and_empty: 'Preskoči i isprazni',
            show_example: 'Prikaži primjer',
            error: {
                title: 'Greška pri uvozu DBML-a',
                description:
                    'Neuspješno parsiranje DBML-a. Molimo provjerite sintaksu.',
            },
        },
        relationship_type: {
            one_to_one: 'Jedan na jedan',
            one_to_many: 'Jedan na više',
            many_to_one: 'Više na jedan',
            many_to_many: 'Više na više',
        },

        canvas_context_menu: {
            new_table: 'Nova tablica',
            new_view: 'Novi Pogled',
            new_relationship: 'Nova veza',
            new_area: 'Novo područje',
            new_note: 'Nova Bilješka',
        },

        table_node_context_menu: {
            edit_table: 'Uredi tablicu',
            duplicate_table: 'Dupliciraj tablicu',
            delete_table: 'Izbriši tablicu',
            add_relationship: 'Dodaj vezu',
        },

        snap_to_grid_tooltip: 'Priljepljivanje na mrežu (Drži {{key}})',

        tool_tips: {
            double_click_to_edit: 'Dvostruki klik za uređivanje',
        },

        language_select: {
            change_language: 'Jezik',
        },

        on: 'Uključeno',
        off: 'Isključeno',
    },
};

export const hrMetadata: LanguageMetadata = {
    name: 'Croatian',
    nativeName: 'Hrvatski',
    code: 'hr',
};
