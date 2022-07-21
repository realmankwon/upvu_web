import React from "react";
import { useState } from "react";
import { Table } from "react-bootstrap";
import { OpenOrdersData } from "../../api/hive";
import BuySellHiveDialog, {
  TransactionType,
} from "../buy-sell-hive";
import { _t } from "../../i18n";
import { Skeleton } from "../skeleton";
import { ActiveUser } from "../../store/active-user/types";
import { dateToFormatted, dateToFullRelative } from '../../helper/parse-date';

const columns = [
  `${_t("market.date")}`,
  `${_t("market.type")}`,
  `${_t("market.price")}`,
  `STEEM`,
  `SBD ($)`,
  `${_t("market.action")}`,
];

interface Props {
  data: OpenOrdersData[];
  loading: boolean;
  username: string;
  onTransactionSuccess: () => void;
  activeUser: ActiveUser
}

export const OpenOrders = ({ data, loading, onTransactionSuccess, activeUser }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState<number>(0);

  return loading ? (
    <Skeleton className="loading-hive" />
  ) : (
    <div className="rounded">
      {isModalOpen ? (
        <>
          <BuySellHiveDialog
                Ttype={TransactionType.Cancel}
                onHide={() => setIsModalOpen(0)}
                global={global}
                onTransactionSuccess={onTransactionSuccess}
                activeUser={activeUser}
                orderid={isModalOpen}
        />
        </>
      ) : null}
      <h5>{_t("market.open-orders")}</h5>
      <Table striped={true} bordered={true} hover={true} size="sm">
        <thead>
          <tr>
            {columns.map((item) => (
              <th key={item}>{item}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            return (
              <tr key={item.id}>
                <td title={dateToFormatted(item.created)}>{dateToFullRelative(item.created)}</td>
                <td>
                  {item.sell_price.base.indexOf("STEEM") > 0 ? "Sell" : "Buy"}
                </td>
                <td>{parseFloat(item.real_price).toFixed(6)}</td>
                <td>{item.sell_price.base.indexOf("STEEM") > 0 ? item.sell_price.base.replace("STEEM","") : item.sell_price.quote.replace("STEEM","")}</td>
                <td>{item.sell_price.base.indexOf("STEEM") > 0 ? item.sell_price.quote.replace("SBD","") : item.sell_price.base.replace("SBD","")}</td>
                <td className="p-2">
                  <div
                    className="rounded text-white bg-primary p-1 d-inline pointer"
                    onClick={() => setIsModalOpen(item.orderid)}
                  >
                    Cancel
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
