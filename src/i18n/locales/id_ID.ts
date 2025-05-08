import type { LanguageMetadata, LanguageTranslation } from '../types';

export const id_ID: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Berkas',
                new: 'Buat Baru',
                open: 'Buka',
                save: 'Simpan',
                import: 'Impor Database',
                export_sql: 'Ekspor SQL',
                export_as: 'Ekspor Sebagai',
                delete_diagram: 'Hapus Diagram',
                exit: 'Keluar',
            },
            edit: {
                edit: 'Ubah',
                undo: 'Undo',
                redo: 'Redo',
                clear: 'Bersihkan',
            },
            view: {
                view: 'Tampilan',
                show_sidebar: 'Tampilkan Sidebar',
                hide_sidebar: 'Sembunyikan Sidebar',
                hide_cardinality: 'Sembunyikan Kardinalitas',
                show_cardinality: 'Tampilkan Kardinalitas',
                zoom_on_scroll: 'Perbesar saat Scroll',
                theme: 'Tema',
                show_dependencies: 'Tampilkan Dependensi',
                hide_dependencies: 'Sembunyikan Dependensi',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: 'Cadangan',
                export_diagram: 'Ekspor Diagram',
                restore_diagram: 'Pulihkan Diagram',
            },
            help: {
                help: 'Bantuan',
                docs_website: 'Dokumentasi',
                join_discord: 'Bergabunglah di Discord kami',
            },
        },

        delete_diagram_alert: {
            title: 'Hapus Diagram',
            description:
                'Tindakan ini tidak dapat dibatalkan. Diagram akan dihapus secara permanen.',
            cancel: 'Batal',
            delete: 'Hapus',
        },

        clear_diagram_alert: {
            title: 'Bersihkan Diagram',
            description:
                'Tindakan ini tidak dapat dibatalkan. Semua data di diagram akan dihapus secara permanen.',
            cancel: 'Batal',
            clear: 'Bersihkan',
        },

        reorder_diagram_alert: {
            title: 'Atur Ulang Diagram',
            description:
                'Tindakan ini akan mengatur ulang semua tabel di diagram. Apakah Anda ingin melanjutkan?',
            reorder: 'Atur Ulang',
            cancel: 'Batal',
        },

        multiple_schemas_alert: {
            title: 'Schema Lebih dari satu',
            description:
                '{{schemasCount}} schema di diagram ini. Sedang ditampilkan: {{formattedSchemas}}.',
            dont_show_again: 'Jangan tampilkan lagi',
            change_schema: 'Ubah',
            none: 'Tidak ada',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Gagal menyalin',
                description: 'Clipboard tidak didukung',
            },
            failed: {
                title: 'Gagal menyalin',
                description: 'Ada yang salah. Silakan coba lagi.',
            },
        },

        theme: {
            system: 'Sistem',
            light: 'Terang',
            dark: 'Gelap',
        },

        zoom: {
            on: 'Aktif',
            off: 'Nonaktif',
        },

        last_saved: 'Terakhir disimpan',
        saved: 'Tersimpan',
        loading_diagram: 'Memuat diagram...',
        deselect_all: 'Batalkan Semua',
        select_all: 'Pilih Semua',
        clear: 'Bersihkan',
        show_more: 'Tampilkan Lebih Banyak',
        show_less: 'Tampilkan Lebih Sedikit',
        copy_to_clipboard: 'Salin ke Clipboard',
        copied: 'Tersalin!',

        side_panel: {
            schema: 'Skema:',
            filter_by_schema: 'Saring berdasarkan skema',
            search_schema: 'Cari skema...',
            no_schemas_found: 'Tidak ada skema yang ditemukan.',
            view_all_options: 'Tampilkan Semua Pilihan...',
            tables_section: {
                tables: 'Tabel',
                add_table: 'Tambah Tabel',
                filter: 'Saring',
                collapse: 'Lipat Semua',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'Kolom',
                    nullable: 'Bisa Kosong?',
                    primary_key: 'Kunci Utama',
                    indexes: 'Indeks',
                    comments: 'Komentar',
                    no_comments: 'Tidak ada komentar',
                    add_field: 'Tambah Kolom',
                    add_index: 'Tambah Indeks',
                    index_select_fields: 'Pilih kolom',
                    no_types_found: 'Tidak ada tipe yang ditemukan',
                    field_name: 'Nama',
                    field_type: 'Tipe',
                    field_actions: {
                        title: 'Atribut Kolom',
                        unique: 'Unik',
                        comments: 'Komentar',
                        no_comments: 'Tidak ada komentar',
                        delete_field: 'Hapus Kolom',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'Atribut Indeks',
                        name: 'Nama',
                        unique: 'Unik',
                        delete_index: 'Hapus Indeks',
                    },
                    table_actions: {
                        title: 'Aksi Tabel',
                        change_schema: 'Ubah Skema',
                        add_field: 'Tambah Kolom',
                        add_index: 'Tambah Indeks',
                        duplicate_table: 'Duplikat Tabel',
                        delete_table: 'Hapus Tabel',
                    },
                },
                empty_state: {
                    title: 'Tidak ada tabel',
                    description: 'Buat tabel untuk memulai',
                },
            },
            relationships_section: {
                relationships: 'Hubungan',
                filter: 'Saring',
                add_relationship: 'Tambah Hubungan',
                collapse: 'Lipat Semua',
                relationship: {
                    primary: 'Tabel Primer',
                    foreign: 'Tabel Referensi',
                    cardinality: 'Kardinalitas',
                    delete_relationship: 'Hapus',
                    relationship_actions: {
                        title: 'Aksi',
                        delete_relationship: 'Hapus',
                    },
                },
                empty_state: {
                    title: 'Tidak ada hubungan',
                    description: 'Buat hubungan untuk menghubungkan tabel',
                },
            },
            dependencies_section: {
                dependencies: 'Dependensi',
                filter: 'Saring',
                collapse: 'Lipat Semua',
                dependency: {
                    table: 'Tabel',
                    dependent_table: 'Tampilan Dependen',
                    delete_dependency: 'Hapus',
                    dependency_actions: {
                        title: 'Aksi',
                        delete_dependency: 'Hapus',
                    },
                },
                empty_state: {
                    title: 'Tidak ada dependensi',
                    description: 'Buat tampilan untuk memulai',
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
            zoom_in: 'Perbesar',
            zoom_out: 'Perkecil',
            save: 'Simpan',
            show_all: 'Tampilkan Semua',
            undo: 'Undo',
            redo: 'Redo',
            reorder_diagram: 'Atur Ulang Diagram',
            highlight_overlapping_tables: 'Sorot Tabel yang Tumpang Tindih',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Apakah Database Anda?',
                description:
                    'Setiap database memiliki fitur dan kemampuan unik.',
                check_examples_long: 'Lihat Contoh',
                check_examples_short: 'Contoh',
            },

            import_database: {
                title: 'Impor Database Anda',
                database_edition: 'Edisi Database:',
                step_1: 'Jalankan skrip ini di database Anda:',
                step_2: 'Tempel hasil skrip di sini:',
                script_results_placeholder: 'Hasil skrip di sini...',
                ssms_instructions: {
                    button_text: 'Instruksi SSMS',
                    title: 'Instruksi',
                    step_1: 'Pergi ke Alat > Opsi > Hasil Kueri > SQL Server.',
                    step_2: 'Jika Anda menggunakan "Hasil ke Grid," ubah Jumlah Karakter yang Diterima untuk Data Non-XML (disetel ke 9999999).',
                },
                instructions_link: 'Butuh Bantuan? Tonton caranya',
                check_script_result: 'Periksa Hasil Skrip',
            },

            cancel: 'Batal',
            import_from_file: 'Impor dari file',
            back: 'Kembali',
            empty_diagram: 'Diagram Kosong',
            continue: 'Lanjutkan',
            import: 'Impor',
        },

        open_diagram_dialog: {
            title: 'Buka Diagram',
            description: 'Pilih diagram untuk dibuka dari daftar di bawah.',
            table_columns: {
                name: 'Name',
                created_at: 'Dibuat pada',
                last_modified: 'Terakhir diubah',
                tables_count: 'Tabel',
            },
            cancel: 'Batal',
            open: 'Buka',
        },

        export_sql_dialog: {
            title: 'Ekspor SQL',
            description: 'Ekspor skema diagram Anda ke skrip {{databaseType}}',
            close: 'Tutup',
            loading: {
                text: 'AI sedang membuat SQL untuk {{databaseType}}...',
                description: 'Ini akan memakan waktu hingga 30 detik.',
            },
            error: {
                message:
                    'Kesalahan saat menghasilkan skrip SQL. Silakan coba lagi nanti atau <0>hubungi kami</0>.',
                description:
                    'Silakan gunakan OPENAI_TOKEN Anda, lihat petunjuk <0>di sini</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Buat Hubungan',
            primary_table: 'Tabel Primer',
            primary_field: 'Kolom Primer',
            referenced_table: 'Tabel Referensi',
            referenced_field: 'Kolom Referensi',
            primary_table_placeholder: 'Pilih tabel',
            primary_field_placeholder: 'Pilih kolom',
            referenced_table_placeholder: 'Pilih tabel',
            referenced_field_placeholder: 'Pilih kolom',
            no_tables_found: 'Tidak ada tabel yang ditemukan',
            no_fields_found: 'Tidak ada kolom yang ditemukan',
            create: 'Buat',
            cancel: 'Batal',
        },

        import_database_dialog: {
            title: 'Impor ke Diagram Saat Ini',
            override_alert: {
                title: 'Impor Database',
                content: {
                    alert: 'Mengimpor diagram ini akan memengaruhi tabel dan hubungan yang ada.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> tabel baru akan ditambahkan.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> hubungan baru akan dibuat.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> tabel akan ditimpa.',
                    proceed: 'Apakah Anda ingin melanjutkan?',
                },
                import: 'Impor',
                cancel: 'Batal',
            },
        },

        export_image_dialog: {
            title: 'Ekspor Gambar',
            description: 'Pilih faktor skala untuk ekspor:',
            scale_1x: '1x Biasa',
            scale_2x: '2x (Disarankan)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Batal',
            export: 'Ekspor',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'Pilih Skema',
            description:
                'Skema yang sedang ditampilkan. Pilih salah satu untuk tabel baru.',
            cancel: 'Batal',
            confirm: 'Konfirmasi',
        },

        update_table_schema_dialog: {
            title: 'Ubah Skema',
            description: 'Perbarui skema tabel "{{tableName}}"',
            cancel: 'Batal',
            confirm: 'Ubah',
        },

        star_us_dialog: {
            title: 'Bantu kami meningkatkan!',
            description:
                'Apakah Anda ingin menambahkan bintang di GitHub? Cukup klik!',
            close: 'Tidak sekarang',
            confirm: 'Tentu saja!',
        },

        export_diagram_dialog: {
            title: 'Ekspor Diagram',
            description: 'Pilih format untuk ekspor:',
            format_json: 'JSON',
            cancel: 'Batal',
            export: 'Ekspor',
            error: {
                title: 'Error ekspor diagram',
                description:
                    'Sesuatu yang salah. Butuh bantuan? support@chartdb.io',
            },
        },

        import_diagram_dialog: {
            title: 'Impor Diagram',
            description: 'Tempel diagram JSON di bawah:',
            cancel: 'Batal',
            import: 'Impor',
            error: {
                title: 'Error impor diagram',
                description:
                    'Diagram JSON tidak valid. Silakan cek JSON dan coba lagi. Butuh bantuan? support@chartdb.io',
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
            one_to_one: 'Satu ke Satu',
            one_to_many: 'Satu ke Banyak',
            many_to_one: 'Banyak ke Satu',
            many_to_many: 'Banyak ke Banyak',
        },

        canvas_context_menu: {
            new_table: 'Tabel Baru',
            new_relationship: 'Hubungan Baru',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'Ubah Tabel',
            delete_table: 'Hapus Tabel',
            duplicate_table: 'Duplikat Tabel',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: 'Snap ke Kisi (Tahan {{key}})',

        tool_tips: {
            double_click_to_edit: 'Klik ganda untuk mengedit',
        },

        language_select: {
            change_language: 'Bahasa',
        },
    },
};

export const id_IDMetadata: LanguageMetadata = {
    name: 'Indonesian',
    nativeName: 'Indonesia',
    code: 'id_ID',
};
