from pathlib import Path

import yaml


class ChannelMappingError(Exception):
    """Raised when mandatory canonical channels cannot be resolved from source data."""

    def __init__(
        self,
        missing_channels: list[str],
        available_channels: list[str],
        candidates: dict[str, list[str]],
    ):
        self.missing_channels = missing_channels
        self.available_channels = available_channels
        self.candidates = candidates
        msg = (
            f"INGESTION FAILED: Missing required canonical channels: {', '.join(missing_channels)}. "
            f"Available channels: {', '.join(available_channels[:15])}."
        )
        if candidates:
            cand_str = "; ".join(f"For '{k}': {v}" for k, v in candidates.items() if v)
            if cand_str:
                msg += f" Potential candidate matches: {cand_str}."
        super().__init__(msg)


class ChannelMapper:
    """Configurable channel mapping engine backed by channel_mapping.yaml."""

    def __init__(self, config_path: Path | None = None):
        if config_path is None:
            config_path = Path(__file__).parent / "channel_mapping.yaml"
        self.config_path = config_path
        self._load_config()

    def _load_config(self) -> None:
        if not self.config_path.exists():
            raise FileNotFoundError(
                f"Mapping configuration file not found at {self.config_path}"
            )

        with open(self.config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        self.version = data.get("version", "1.0.0")
        self.core_specs: dict[str, dict] = data.get("core_channels", {})
        self.optional_specs: dict[str, dict] = data.get("optional_channels", {})

        # Fast lookup map: normalized_alias -> canonical_name
        self.alias_to_canonical: dict[str, str] = {}
        for canonical, spec in {**self.core_specs, **self.optional_specs}.items():
            self.alias_to_canonical[canonical.lower().strip()] = canonical
            for alias in spec.get("aliases", []):
                self.alias_to_canonical[alias.lower().strip()] = canonical

    @staticmethod
    def _normalize(name: str) -> str:
        return name.strip().lower().replace(" ", "_").replace("-", "_")

    def resolve_channel(self, source_col: str) -> str | None:
        """Resolves a single source channel name to its canonical channel."""
        norm = self._normalize(source_col)
        return self.alias_to_canonical.get(norm)

    def map_columns(
        self, source_columns: list[str], enforce_core: bool = True
    ) -> tuple[dict[str, str], list[str]]:
        """
        Maps a list of source column names to canonical names.
        Returns:
            (source_to_canonical_dict, missing_core_channels_list)
        """
        mapping: dict[str, str] = {}
        mapped_canonicals: set[str] = set()

        for col in source_columns:
            canonical = self.resolve_channel(col)
            if canonical and canonical not in mapped_canonicals:
                mapping[col] = canonical
                mapped_canonicals.add(canonical)

        missing_core = [c for c in self.core_specs if c not in mapped_canonicals]

        if enforce_core and missing_core:
            candidates: dict[str, list[str]] = {}
            for missing in missing_core:
                cands = [
                    sc
                    for sc in source_columns
                    if missing in self._normalize(sc)
                    or any(
                        alias in self._normalize(sc)
                        for alias in self.core_specs[missing].get("aliases", [])
                    )
                ]
                candidates[missing] = cands

            raise ChannelMappingError(
                missing_channels=missing_core,
                available_channels=source_columns,
                candidates=candidates,
            )

        return mapping, missing_core

    def get_canonical_list(self) -> list[str]:
        return list(self.core_specs.keys()) + list(self.optional_specs.keys())


channel_mapper = ChannelMapper()
