import { useEffect, useState } from "react";
import {
  Box, HStack,
  Text, Switch, Select, Option, Separator,
  Tabs, TabList, Tab, TabPanel,
  NativeTable, Thead, Tbody, Tr, Th, Td,
  Checkbox, Image,
  Popover, PopoverTrigger, PopoverContent, PopoverBody,
  Loading,
} from "@yamada-ui/react";
import {
  CheckIcon,
  BugIcon, FishIcon, ShellIcon,
  TypeIcon, ImageIcon,
} from "@yamada-ui/lucide";

type Type = "insects" | "fish" | "sea_creatures";

interface Season {
  北半球: string;
  南半球: string;
}

interface BaseCreature {
  ナンバー: string;
  名前: string;
  画像リンク: string;
  値段: string;
  場所: string;
  季節: Season;
  時間: string;
}

interface ShadowCreature extends BaseCreature {
  影: string;
}

type Creature = BaseCreature | ShadowCreature;

type ViewMode = "checklist" | "price";

const STORAGE_KEYS: Record<Type, string> = {
  insects: "insects",
  fish: "fish",
  sea_creatures: "sea_creatures",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Type>(() => {
    const saved = localStorage.getItem("activeTab");
    if (saved === "insects" || saved === "fish" || saved === "sea_creatures") {
      return saved;
    }
    return "insects"; // デフォルト
  });
  const [data, setData] = useState<Creature[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isNorth, setIsNorth] = useState(() => {
    const saved = localStorage.getItem("isNorth");
    return saved ? JSON.parse(saved) : true;
  });
  const [loading, setLoading] = useState(false);
  const [showUncheckedOnly, setShowUncheckedOnly] = useState(() => {
    const saved = localStorage.getItem("showUncheckedOnly");
    return saved ? JSON.parse(saved) : false;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem("selectedMonth") || "";
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("viewMode") as ViewMode) || "checklist";
  });
  const [allData, setAllData] = useState<{ type: Type; item: Creature }[]>([]);
  const [showImageInPriceTable, setShowImageInPriceTable] = useState(() => {
    const saved = localStorage.getItem("showImageInPriceTable");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("showUncheckedOnly", JSON.stringify(showUncheckedOnly));
  }, [showUncheckedOnly]);

  useEffect(() => {
    localStorage.setItem("selectedMonth", selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem("isNorth", JSON.stringify(isNorth));
  }, [isNorth]);

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("showImageInPriceTable", JSON.stringify(showImageInPriceTable));
  }, [showImageInPriceTable]);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}json/${activeTab}.json`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));

    const stored = localStorage.getItem(STORAGE_KEYS[activeTab]);
    setChecked(new Set(stored ? JSON.parse(stored) : []));
  }, [activeTab]);

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checked);
    newChecked.has(id) ? newChecked.delete(id) : newChecked.add(id);
    setChecked(newChecked);
    localStorage.setItem(STORAGE_KEYS[activeTab], JSON.stringify([...newChecked]));
  };

  useEffect(() => {
    Promise.all(
      ["insects", "fish", "sea_creatures"].map(async (type) => {
        const res = await fetch(`${import.meta.env.BASE_URL}json/${type}.json`);
        const json = await res.json();
        return json.map((item: Creature) => ({ type, item }));
      })
    ).then((results) => {
      setAllData(results.flat());
    });
  }, []);

  const isMonthInSeason = (seasonStr: string, month: number): boolean => {
    if (!seasonStr) return false;

    // 「いつでも」や「通年」なら常に true にする
    if (seasonStr.includes("いつでも") || seasonStr.includes("通年")) {
      return true;
    }

    // 範囲（〜）があるかチェック
    if (seasonStr.includes("〜")) {
      const parts = seasonStr.split("〜");
      if (parts.length !== 2) return false;

      const parseMonth = (s: string) => {
        const m = s.match(/(\d{1,2})月/);
        return m ? Number(m[1]) : null;
      };

      const start = parseMonth(parts[0]);
      const end = parseMonth(parts[1]);
      if (start === null || end === null) return false;

      if (start <= end) {
        return month >= start && month <= end;
      } else {
        // 年跨ぎ
        return month >= start || month <= end;
      }
    }

    // 範囲じゃなく単一月の可能性（例： '9月'）
    {
      const m = seasonStr.match(/(\d{1,2})月/);
      if (m) {
        const singleMonth = Number(m[1]);
        return month === singleMonth;
      }
    }

    // ここまででマッチしなければ false
    return false;
  };

  const filteredData = data.filter((item) => {
    // 未チェックのみ
    if (showUncheckedOnly && checked.has(item.ナンバー)) return false;

    // 月フィルター
    if (selectedMonth !== "") {
      const monthNum = Number(selectedMonth);
      const seasonStr = isNorth ? item.季節.北半球 : item.季節.南半球;
      if (!isMonthInSeason(seasonStr, monthNum)) return false;
    }

    return true;
  });

  const renderTable = () => {
    if (loading) return <Loading fontSize="xl" />;

    const hasShadow = activeTab !== "insects";

    return (
      <NativeTable size="sm" sx={{ "th, td": { textAlign: "center", verticalAlign: "middle" } }}>
        <Thead>
          <Tr>
            <Th><CheckIcon fontSize="sm" /></Th>
            <Th>名前</Th>
            {hasShadow && <Th>影</Th>}
            <Th>値段<Separator variant="dashed" my={1} />場所</Th>
            <Th>季節<Separator variant="dashed" my={1} />時間</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredData.map((item) => (
            <Tr key={item.ナンバー}>
              <Td>
                <Checkbox
                  checked={checked.has(item.ナンバー)}
                  onChange={() => toggleCheck(item.ナンバー)}
                />
              </Td>

              {/* 画像 + 名前 */}
              <Td>
                <Box textAlign="center">
                  <Image boxSize="40px" src={item.画像リンク} alt={item.名前} mx="auto" />
                  <Text fontSize="xs" mt={1}>{item.名前}</Text>
                </Box>
              </Td>

              {/* 影（サカナ・海の幸のみ） */}
              {hasShadow && (
                <Td>
                  <Text fontSize="sm">
                    {"影" in item ? item.影 : "-"}
                  </Text>
                </Td>
              )}

              {/* 値段・場所 */}
              <Td>
                <Text fontSize="sm">{item.値段}</Text>
                <Separator variant="dashed" my={1} />
                <Text fontSize="xs" color="gray.600">{item.場所}</Text>
              </Td>

              {/* 季節・時間 */}
              <Td>
                <Text fontSize="sm">{isNorth ? item.季節.北半球 : item.季節.南半球}</Text>
                <Separator variant="dashed" my={1} />
                <Text fontSize="xs" color="gray.600">{item.時間}</Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </NativeTable>
    );
  };

  const renderPriceTable = () => {
    const groupedByPrice: Record<
      string,
      { insects: Creature[]; fish: Creature[]; sea_creatures: Creature[] }
    > = {};

    for (const { type, item } of allData) {
      const price = item.値段;
      if (!groupedByPrice[price]) {
        groupedByPrice[price] = {
          insects: [],
          fish: [],
          sea_creatures: [],
        };
      }
      groupedByPrice[price][type].push(item);
    }

    const sortedPrices = Object.keys(groupedByPrice)
      .map(Number)
      .sort((a, b) => b - a);

    return (
      <NativeTable size="sm">
        <Thead>
          <Tr>
            <Th>値段</Th>
            <Th>ムシ</Th>
            <Th>サカナ</Th>
            <Th>うみのさち</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedPrices.map((price) => {
            const group = groupedByPrice[price];

            const renderCell = (creatures: Creature[]) =>
              showImageInPriceTable ? (
                <HStack wrap="wrap">
                  {creatures.map((item) => (
                    <Popover key={item.ナンバー} trigger="click" placement="top" closeOnButton={false}>
                      <PopoverTrigger>
                        <Box cursor="pointer">
                          <Image
                            src={item.画像リンク}
                            boxSize="40px"
                            alt={item.名前}
                          />
                        </Box>
                      </PopoverTrigger>
                      <PopoverContent>
                        <PopoverBody>{item.名前}</PopoverBody>
                      </PopoverContent>
                    </Popover>
                  ))}
                </HStack>
              ) : (
                <Box whiteSpace="pre-line">
                  {creatures.map((item) => `・${item.名前}`).join("\n")}
                </Box>
              );

            return (
              <Tr key={price}>
                <Td>{price}</Td>
                <Td>{renderCell(group.insects)}</Td>
                <Td>{renderCell(group.fish)}</Td>
                <Td>{renderCell(group.sea_creatures)}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </NativeTable>
    );
  };

  return (
    <Box>
      <Tabs
        variant="sticky" fitted
        index={["checklist", "price"].indexOf(viewMode)}
        onChange={(index) => setViewMode(["checklist", "price"][index] as ViewMode)}
      >
        <TabList>
          <Tab>チェックリスト</Tab>
          <Tab>値段表</Tab>
        </TabList>

        <TabPanel>
          <HStack justify="space-around" mb={4}>
            <HStack>
              <Text fontSize="sm">未チェックのみ</Text>
              <Switch checked={showUncheckedOnly} onChange={(e) => setShowUncheckedOnly(e.target.checked)} />
            </HStack>

            <Separator orientation="vertical" variant="solid" h={8} />

            <HStack>
              <Text fontSize="sm">月を指定</Text>
              <Select
                value={selectedMonth}
                onChange={(value) => setSelectedMonth(value)}
              >
                <Option value="">全て</Option>
                {[...Array(12)].map((_, i) => (
                  <Option key={i + 1} value={String(i + 1)}>
                    {`${i + 1}月`}
                  </Option>
                ))}
              </Select>
            </HStack>

            <Separator orientation="vertical" variant="solid" h={8} />

            <HStack>
              <Text fontSize="sm">南</Text>
              <Switch checked={isNorth} onChange={(e) => setIsNorth(e.target.checked)} />
              <Text fontSize="sm">北</Text>
            </HStack>
          </HStack>

          <Tabs
            variant="sticky" fitted
            index={["insects", "fish", "sea_creatures"].indexOf(activeTab)}
            onChange={(index) => setActiveTab(["insects", "fish", "sea_creatures"][index] as Type)}
          >
            <TabList>
              <Tab><BugIcon fontSize="xl" /></Tab>
              <Tab><FishIcon fontSize="xl" /></Tab>
              <Tab><ShellIcon fontSize="xl" /></Tab>
            </TabList>
            <TabPanel>{activeTab === "insects" && renderTable()}</TabPanel>
            <TabPanel>{activeTab === "fish" && renderTable()}</TabPanel>
            <TabPanel>{activeTab === "sea_creatures" && renderTable()}</TabPanel>
          </Tabs>
        </TabPanel>

        <TabPanel>
          <HStack mb={4}>
            <TypeIcon fontSize="md" />
            <Switch
              checked={showImageInPriceTable}
              onChange={(e) => setShowImageInPriceTable(e.target.checked)}
            />
            <ImageIcon fontSize="md" />
          </HStack>

          {renderPriceTable()}
        </TabPanel>
      </Tabs>
    </Box>
  );
}
