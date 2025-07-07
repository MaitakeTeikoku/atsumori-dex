import { useEffect, useState } from "react";
import {
  Container, HStack,
  Text,
  Switch,
  Separator,
  Tabs, TabList, Tab, TabPanel,
  NativeTable, Thead, Tbody, Tr, Th, Td,
  Checkbox,
  Image,
  Loading,
} from "@yamada-ui/react";
import {
  CheckIcon,
  BugIcon, FishIcon, ShellIcon,
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

const STORAGE_KEYS: Record<Type, string> = {
  insects: "checked-insects",
  fish: "checked-fish",
  sea_creatures: "checked-sea",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Type>("insects");
  const [data, setData] = useState<Creature[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isNorth, setIsNorth] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [showUncheckedOnly, setShowUncheckedOnly] = useState(false);

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

  const filteredData = showUncheckedOnly
    ? data.filter((item) => !checked.has(item.ナンバー))
    : data;

  const renderTable = () => {
    if (loading) return <Loading fontSize="xl" />;

    const hasFishShadow = activeTab !== "insects";

    return (
      <NativeTable size="sm">
        <Thead>
          <Tr>
            <Th><CheckIcon fontSize="sm" /></Th>
            <Th>画像</Th>
            <Th>名前</Th>
            {hasFishShadow && <Th>影</Th>}
            <Th>値段</Th>
            <Th>場所</Th>
            <Th>季節</Th>
            <Th>時間</Th>
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
              <Td>
                <Image boxSize="40px" src={item.画像リンク} alt={item.名前} />
              </Td>
              <Td>{item.名前}</Td>
              {hasFishShadow && <Td>{"影" in item ? item.影 : "-"}</Td>}
              <Td>{item.値段}</Td>
              <Td>{item.場所}</Td>
              <Td>{isNorth ? item.季節.北半球 : item.季節.南半球}</Td>
              <Td>{item.時間}</Td>
            </Tr>
          ))}
        </Tbody>
      </NativeTable>
    );
  };

  return (
    <Container centerContent>
      <HStack justify="space-between" mb="4">
        <HStack>
          <Text fontSize="sm">未チェックのみ</Text>
          <Switch checked={showUncheckedOnly} onChange={(e) => setShowUncheckedOnly(e.target.checked)} />
        </HStack>

        <Separator orientation="vertical" variant="solid" h={10} />

        <HStack>
          <Text fontSize="sm">南</Text>
          <Switch checked={isNorth} onChange={(e) => setIsNorth(e.target.checked)} />
          <Text fontSize="sm">北</Text>
        </HStack>
      </HStack>

      <Tabs
        variant="sticky"
        fitted
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
    </Container>
  );
}
