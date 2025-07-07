import { useEffect, useState } from "react";
import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  NativeTable,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Image,
  Switch,
  HStack,
  Text,
  Loading,
} from "@yamada-ui/react";

type Type = "insects" | "fish" | "sea_creatures";

interface Season {
  北半球: string;
  南半球: string;
}

interface BaseCreature {
  ナンバー: string;
  名前: string;
  画像URL: string;
  値段: string;
  場所: string;
  季節: Season;
  時間: string;
}

interface FishCreature extends BaseCreature {
  魚影: string;
}

type Creature = BaseCreature | FishCreature;

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

  const renderTable = () => {
    if (loading) return <Loading size="xl" />;

    const hasFishShadow = activeTab !== "insects";

    return (
      <NativeTable size="sm">
        <Thead>
          <Tr>
            <Th>✔</Th>
            <Th>画像</Th>
            <Th>名前</Th>
            {hasFishShadow && <Th>魚影</Th>}
            <Th>値段</Th>
            <Th>場所</Th>
            <Th>{isNorth ? "北" : "南"}</Th>
            <Th>時間</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item) => (
            <Tr key={item.ナンバー}>
              <Td>
                <Checkbox
                  isChecked={checked.has(item.ナンバー)}
                  onChange={() => toggleCheck(item.ナンバー)}
                />
              </Td>
              <Td>
                <Image boxSize="40px" src={item.画像URL} alt={item.名前} />
              </Td>
              <Td>{item.名前}</Td>
              {hasFishShadow && <Td>{"魚影" in item ? item.魚影 : "-"}</Td>}
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
    <Box p="4">
      {/* 北南切り替え */}
      <HStack justify="flex-end" mb="4">
        <Text fontSize="sm">南半球</Text>
        <Switch isChecked={isNorth} onChange={(e) => setIsNorth(e.target.checked)} />
        <Text fontSize="sm">北半球</Text>
      </HStack>

      <Tabs
        variant="enclosed"
        isFitted
        index={["insects", "fish", "sea_creatures"].indexOf(activeTab)}
        onChange={(index) => setActiveTab(["insects", "fish", "sea_creatures"][index] as Type)}
      >
        <TabList>
          <Tab>ムシ</Tab>
          <Tab>サカナ</Tab>
          <Tab>うみのさち</Tab>
        </TabList>
        <TabPanel>{activeTab === "insects" && renderTable()}</TabPanel>
        <TabPanel>{activeTab === "fish" && renderTable()}</TabPanel>
        <TabPanel>{activeTab === "sea_creatures" && renderTable()}</TabPanel>
      </Tabs>
    </Box>
  );
}
